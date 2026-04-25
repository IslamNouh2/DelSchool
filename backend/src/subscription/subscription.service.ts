import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './subscription.dto';
import { PLAN_PRICES } from './pricing.constants';
import { Prisma, SubscriptionStatus, BillingPeriod } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async invalidateCache(tenantId: string) {
    await Promise.all([
      this.cacheManager.del(`sub_status:${tenantId}`),
      this.cacheManager.del(`sub_check:${tenantId}`),
    ]);
  }

  async findByTenant(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: {
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });
    if (!subscription)
      throw new NotFoundException(
        `No subscription found for tenant ${tenantId}`,
      );
    return subscription;
  }

  async create(dto: CreateSubscriptionDto, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const startDate = new Date(dto.startDate);
    const endDate = this.computeEndDate(startDate, dto.billingPeriod);
    const price = PLAN_PRICES[dto.plan][dto.billingPeriod];

    // Check if tenant exists to prevent foreign key violation
    const tenant = await client.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${dto.tenantId}" not found`);
    }

    const subscription = await client.subscription.create({
      data: {
        tenantId: dto.tenantId,
        plan: dto.plan,
        billingPeriod: dto.billingPeriod,
        startDate,
        endDate,
        price,
        autoRenew: dto.autoRenew ?? true,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    await client.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        event: 'Subscription started',
        plan: dto.plan,
        billingPeriod: dto.billingPeriod,
      },
    });

    await this.invalidateCache(dto.tenantId);
    return subscription;
  }

  async update(tenantId: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
    });

    if (!subscription)
      throw new NotFoundException('No active or trial subscription found');

    const plan = dto.plan || subscription.plan;
    const billingPeriod = dto.billingPeriod || subscription.billingPeriod;
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : subscription.startDate;
    let endDate = subscription.endDate;
    if (dto.billingPeriod || dto.startDate) {
      endDate = this.computeEndDate(startDate, billingPeriod);
    }

    const price = PLAN_PRICES[plan][billingPeriod];

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          ...dto,
          startDate,
          endDate,
          price,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: updated.id,
          event: 'Plan updated',
          plan: updated.plan,
          billingPeriod: updated.billingPeriod,
        },
      });

      return updated;
    });

    await this.invalidateCache(tenantId);
    return result;
  }

  async renewNow(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    const startDate = new Date();
    const endDate = this.computeEndDate(startDate, subscription.billingPeriod);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          startDate,
          endDate,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: updated.id,
          event: 'Renewed',
          plan: updated.plan,
          billingPeriod: updated.billingPeriod,
        },
      });

      return updated;
    });

    await this.invalidateCache(tenantId);
    return result;
  }

  async suspend(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.SUSPENDED },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: updated.id,
          event: 'Suspended',
          plan: updated.plan,
          billingPeriod: updated.billingPeriod,
        },
      });

      return updated;
    });

    await this.invalidateCache(tenantId);
    return result;
  }

  async checkAndExpire() {
    const now = new Date();
    const toExpire = await this.prisma.subscription.findMany({
      where: {
        endDate: { lt: now },
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
    });

    for (const sub of toExpire) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
      await this.invalidateCache(sub.tenantId);
    }
  }

  async getStats() {
    const subs = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
      },
    });

    const total = await this.prisma.subscription.count();
    const active = subs.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE,
    ).length;
    const trial = subs.filter(
      (s) => s.status === SubscriptionStatus.TRIAL,
    ).length;
    const expired = await this.prisma.subscription.count({
      where: { status: SubscriptionStatus.EXPIRED },
    });
    const suspended = await this.prisma.subscription.count({
      where: { status: SubscriptionStatus.SUSPENDED },
    });
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    const expiringIn30Days = await this.prisma.subscription.count({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        endDate: { gte: now, lte: in30Days },
      },
    });

    const estimatedMRR = subs.reduce((sum, sub) => {
      let mrr = 0;
      if (sub.billingPeriod === BillingPeriod.MONTHLY) mrr = Number(sub.price);
      if (sub.billingPeriod === BillingPeriod.QUARTERLY)
        mrr = Number(sub.price) / 3;
      if (sub.billingPeriod === BillingPeriod.YEARLY)
        mrr = Number(sub.price) / 12;
      return sum + mrr;
    }, 0);

    return {
      total,
      active,
      trial,
      expired,
      suspended,
      expiringIn30Days,
      estimatedMRR: Math.round(estimatedMRR),
    };
  }

  async check(tenantId: string) {
    const cacheKey = `sub_check:${tenantId}`;
    interface CheckResult {
      blocked: boolean;
      reason: string | null;
      tenantName: string;
      endDate?: Date;
    }
    const cached = await this.cacheManager.get<CheckResult>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, status: true },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      const result = {
        blocked: true,
        reason: 'NO_SUBSCRIPTION',
        tenantName: tenant.name,
      };
      await this.cacheManager.set(cacheKey, result, 600000);
      return result;
    }

    const isBlocked =
      subscription.status === SubscriptionStatus.EXPIRED ||
      subscription.status === SubscriptionStatus.SUSPENDED ||
      tenant.status !== 'ACTIVE';

    const result = {
      blocked: isBlocked,
      reason: isBlocked
        ? subscription.status === SubscriptionStatus.ACTIVE
          ? 'TENANT_SUSPENDED'
          : subscription.status
        : null,
      tenantName: tenant.name,
      endDate: subscription.endDate,
    };

    await this.cacheManager.set(cacheKey, result, 600000);
    return result;
  }

  private computeEndDate(startDate: Date, period: BillingPeriod): Date {
    const date = new Date(startDate);
    if (period === BillingPeriod.MONTHLY) date.setDate(date.getDate() + 30);
    else if (period === BillingPeriod.QUARTERLY)
      date.setDate(date.getDate() + 90);
    else if (period === BillingPeriod.YEARLY)
      date.setDate(date.getDate() + 365);
    return date;
  }
}
