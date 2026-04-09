import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
  };
  tenantId?: string;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const url = request.url;

    // 1. Exclude specific routes
    const excludedPaths = ['/auth', '/health'];

    // Check if URL starts with any excluded path or is a renew route
    if (
      excludedPaths.some((path) => url.startsWith(path)) ||
      url.includes('/renew')
    ) {
      return true;
    }

    // 2. Extract tenantId from JWT payload
    const tenantId = request.user?.tenantId ?? request.tenantId;

    if (!tenantId) {
      // If no tenantId, we can't check subscription.
      // This might happen on public routes not covered by excludedPaths.
      return true;
    }

    // 3. Check subscription status
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
        message: 'Your subscription has expired. Please renew to continue.',
      });
    }

    return true;
  }
}
