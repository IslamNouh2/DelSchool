import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

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
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { url, user } = request;

    // Manual overlaps for routes that might not be tagged but should be skipped
    const skipPaths = [
      '/auth',
      '/health',
      '/tenants/register',
      '/subscriptions/check',
    ];
    const isSkip =
      skipPaths.some((path) => url.includes(path)) ||
      (url.includes('/subscriptions/') && url.endsWith('/renew'));

    if (isSkip) return true;

    const tenantId = user?.tenantId;
    if (!tenantId) {
      // If we're here, JwtAuthGuard should have already run (or this is a non-protected route)
      // But if somehow no tenantId, block if not in skip list
      throw new ForbiddenException({
        blocked: true,
        reason: 'NO_TENANT_ID',
        message: 'No tenant ID found in session.',
      });
    }

    try {
      const subscription = await this.subscriptionService.findByTenant(tenantId);

      if (!subscription) {
        throw new ForbiddenException({
          blocked: true,
          reason: 'NO_SUBSCRIPTION',
          message: 'No subscription found for this tenant.',
        });
      }

      if (
        subscription.status === SubscriptionStatus.EXPIRED ||
        subscription.status === SubscriptionStatus.SUSPENDED
      ) {
        throw new ForbiddenException({
          blocked: true,
          reason: subscription.status,
          message: 'Subscription inactive. Please renew.',
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;

      // If findByTenant throws because no sub found
      throw new ForbiddenException({
        blocked: true,
        reason: 'NO_SUBSCRIPTION',
        message: 'Subscription inactive. Please renew.',
      });
    }
  }
}
