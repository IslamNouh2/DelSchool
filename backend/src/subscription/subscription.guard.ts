import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    email: string;
    sub: number;
  };
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { url, user } = request;

    // SKIP paths: Allow authentication, health checks, and subscription renewal itself
    const skipPaths = ['/auth', '/health', '/tenants/register'];
    const isSubscriptionAction = url.includes('/subscriptions/');

    const isSkip =
      skipPaths.some((path) => url.includes(path)) || isSubscriptionAction; // Allow all subscription management actions to bypass the block check for the admin to renew

    if (isSkip) return true;

    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException({
        blocked: true,
        reason: 'NO_TENANT_ID',
        message: 'No tenant ID found in session.',
      });
    }

    try {
      const cacheKey = `sub_status:${tenantId}`;
      let subscriptionStatus =
        await this.cacheManager.get<SubscriptionStatus>(cacheKey);

      if (!subscriptionStatus) {
        const subscription =
          await this.subscriptionService.findByTenant(tenantId);
        if (!subscription) {
          throw new ForbiddenException({
            blocked: true,
            reason: 'NO_SUBSCRIPTION',
            message: 'No subscription found for this tenant.',
          });
        }
        subscriptionStatus = subscription.status;
        await this.cacheManager.set(cacheKey, subscriptionStatus, 600000); // 10 minutes
      }

      if (
        subscriptionStatus === SubscriptionStatus.EXPIRED ||
        subscriptionStatus === SubscriptionStatus.SUSPENDED
      ) {
        throw new ForbiddenException({
          blocked: true,
          reason: subscriptionStatus,
          message: 'Subscription inactive. Please renew.',
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      throw new ForbiddenException({
        blocked: true,
        reason: 'NO_SUBSCRIPTION',
        message: 'Subscription inactive. Please renew.',
      });
    }
  }
}
