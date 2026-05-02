import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { tenantId?: string; user?: { tenantId?: string } }>();
    // Check both locations: manually set by TenantGuard or automatically by JwtStrategy
    return request.tenantId || request.user?.tenantId;
  },
);
