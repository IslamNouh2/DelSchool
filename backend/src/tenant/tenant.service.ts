import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { RegisterTenantDto } from './tenant.dto';
import { TenantStatus, Prisma, Plan, BillingPeriod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async register(dto: RegisterTenantDto) {
    // 1. Check domain uniqueness BEFORE transaction
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { domain: dto.domain },
    });
    if (existingTenant) {
      throw new ConflictException(`Domain ${dto.domain} is already taken.`);
    }

    // 1.1 Check admin email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingUser) {
      throw new ConflictException(
        `Email ${dto.adminEmail} is already registered.`,
      );
    }

    // 2. Wrap database operations in a single transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          domain: dto.domain,
          plan: dto.plan,
          status: TenantStatus.ACTIVE,
        },
      });

      // Hash password
      const hashedPayload = await bcrypt.hash(dto.adminPassword, 10);

      // Create User (Admin)
      const user = await tx.user.create({
        data: {
          email: dto.adminEmail,
          username: dto.domain, // Using domain as username for admin
          password: hashedPayload,
          tenantId: tenant.id,
          status: 'ACTIVE', // Enum type safety
        },
      });

      // Find 'ADMIN' role
      const adminRole = await tx.role.findUnique({
        where: { name: 'ADMIN' },
      });
      if (!adminRole) {
        throw new NotFoundException(
          'ADMIN role not found. Please seed roles first.',
        );
      }

      // Attach role to user
      await tx.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
      });

      // Create Subscription via SubscriptionService
      // Note: SubscriptionService.create needs to handle the tx client
      const subscription = await this.subscriptionService.create(
        {
          tenantId: tenant.id,
          plan: dto.plan,
          billingPeriod: dto.billingPeriod,
          startDate: new Date().toISOString(),
          autoRenew: true,
        },
        tx,
      );

      return {
        tenant,
        subscription,
        message: 'School registered successfully',
      };
    });
  }

  async findAll(filters: {
    status?: TenantStatus;
    plan?: Plan;
    billingPeriod?: BillingPeriod;
    search?: string;
  }) {
    const where: Prisma.TenantWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.plan) where.plan = filters.plan;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { domain: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await this.prisma.tenant.findMany({
      where,
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          include: {
            history: {
              orderBy: { changedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);
    return tenant;
  }

  async updateStatus(tenantId: string, status: TenantStatus) {
    return await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });
  }
}
