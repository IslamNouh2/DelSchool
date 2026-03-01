import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken || request.headers.authorization?.split(' ')[1];

    if (!token) {
      // Let other guards (like JwtAuthGuard) handle the "no token" case.
      // TenantGuard should only enforce tenant logic if a token is actually present.
      return true;
    }

    try {
      const payload = this.jwtService.decode(token) as any;
      
      // If we can't decode it, or it doesn't have a tenantId, we might be in transition.
      // In a strict multi-tenant system, we should throw. 
      // For now, we'll attach 'default-tenant' or let it pass if we want to be lenient.
      if (payload && payload.tenantId) {
        request.tenantId = payload.tenantId;
        request.user = payload;
      } else {
        // Log warning or handle transition
        console.warn('Token present but missing tenantId. Using fallback or passing through.');
        request.tenantId = 'default-tenant';
      }
      
      return true;
    } catch (e) {
      // Decode failed, let it pass and let JwtAuthGuard handle the invalidity
      return true;
    }
  }
}
