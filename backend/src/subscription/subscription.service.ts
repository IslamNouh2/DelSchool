import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './subscription.dto';
import { PLAN_PRICES } from './pricing.constants';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SubscriptionStatus,
  BillingPeriod,
  Subscription,
} from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string): Promise<Subscription | null> {
    return await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: {
        history: true,
        tenant: true,
      },
    });
  }

  // ======== ADMIN METHODS (SaaS Owner) ========

  async adminGetStats() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    const totalMRR = subscriptions.reduce((sum, sub) => {
      if (sub.billingPeriod === BillingPeriod.MONTHLY) return sum + sub.price;
      if (sub.billingPeriod === BillingPeriod.QUARTERLY)
        return sum + sub.price / 3;
      if (sub.billingPeriod === BillingPeriod.YEARLY)
        return sum + sub.price / 12;
      return sum;
    }, 0);

    const totalTenants = await this.prisma.tenant.count();
    const activeSubscriptions = subscriptions.length;
    const expiredCount = await this.prisma.subscription.count({
      where: { status: SubscriptionStatus.EXPIRED },
    });

    return {
      mrr: Math.round(totalMRR),
      totalTenants,
      activeSubscriptions,
      expiredCount,
    };
  }

  async adminGetAllSubscriptions() {
    return await this.prisma.subscription.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async adminForceUpdate(tenantId: string, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!existing) {
      // If no subscription exists, create one for this tenant
      return this.create(tenantId, {
        plan: dto.plan || 'STARTER',
        billingPeriod: dto.billingPeriod || 'MONTHLY',
        startDate: dto.startDate || new Date(),
        autoRenew: dto.autoRenew,
      } as CreateSubscriptionDto);
    }

    return this.update(tenantId, dto);
  }

  // ======== EXISTING METHODS ========

  private calculateEndDate(
    startDate: Date,
    billingPeriod: BillingPeriod,
  ): Date {
    const endDate = new Date(startDate);
    if (billingPeriod === BillingPeriod.MONTHLY) {
      endDate.setDate(endDate.getDate() + 30);
    } else if (billingPeriod === BillingPeriod.QUARTERLY) {
      endDate.setDate(endDate.getDate() + 90);
    } else if (billingPeriod === BillingPeriod.YEARLY) {
      endDate.setDate(endDate.getDate() + 365);
    }
    return endDate;
  }

  async create(
    tenantId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const startDate = new Date(dto.startDate);
    const endDate = this.calculateEndDate(startDate, dto.billingPeriod);
    const price = PLAN_PRICES[dto.plan][dto.billingPeriod];

    return await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          tenantId,
          plan: dto.plan,
          billingPeriod: dto.billingPeriod,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
          autoRenew: dto.autoRenew ?? true,
          price,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: subscription.id,
          event: 'INITIAL_CREATION',
          plan: dto.plan,
          billingPeriod: dto.billingPeriod,
        },
      });

      return subscription;
    });
  }

  async update(
    tenantId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!existing) throw new NotFoundException('Subscription not found');

    const plan = dto.plan ?? existing.plan;
    const billingPeriod = dto.billingPeriod ?? existing.billingPeriod;
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const endDate =
      dto.plan || dto.billingPeriod || dto.startDate
        ? this.calculateEndDate(startDate, billingPeriod)
        : existing.endDate;
    const price = PLAN_PRICES[plan][billingPeriod];

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: existing.id },
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
          event: 'UPDATE',
          plan: updated.plan,
          billingPeriod: updated.billingPeriod,
        },
      });

      return updated;
    });
  }

  async renewNow(tenantId: string): Promise<Subscription> {
    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!existing) throw new NotFoundException('Subscription not found');

    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, existing.billingPeriod);

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: existing.id },
        data: {
          startDate,
          endDate,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: updated.id,
          event: 'RENEWAL',
          plan: updated.plan,
          billingPeriod: updated.billingPeriod,
        },
      });

      return updated;
    });
  }

  async suspend(tenantId: string): Promise<Subscription> {
    const existing = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!existing) throw new NotFoundException('Subscription not found');

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: existing.id },
        data: { status: SubscriptionStatus.SUSPENDED },
      });

      await tx.subscriptionHistory.create({
        data: {
          subscriptionId: updated.id,
          event: 'SUSPENSION',
          plan: updated.plan,
          billingPeriod: updated.billingPeriod,
        },
      });

      return updated;
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkExpired(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.subscription.findMany({
      where: {
        endDate: { lt: now },
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const sub of expired) {
      await this.prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });

        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: sub.id,
            event: 'AUTO_EXPIRATION',
            plan: sub.plan,
            billingPeriod: sub.billingPeriod,
          },
        });
      });
      console.log(
        `[SubscriptionService] Subscription ${sub.id} (Tenant: ${sub.tenantId}) marked as EXPIRED.`,
      );
    }
  }
}
