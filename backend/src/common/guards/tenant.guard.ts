import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: JwtPayload;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    const cookies = request.cookies as Record<string, string | undefined> | undefined;
    const authHeader = request.headers.authorization;

    const token = cookies?.accessToken || authHeader?.split(' ')[1];

    if (!token) {
      // JwtAuthGuard will handle the 401 if not public
      return true;
    }

    try {
      // Verify signature to prevent spoofing before reading payload
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload && payload.tenantId) {
        request.tenantId = payload.tenantId;
        request.user = payload;
        return true;
      }

      throw new UnauthorizedException('Tenant context missing in token');
    } catch {
      // If verification fails, we don't attach tenantId.
      // JwtAuthGuard will catch the invalidity later.
      return true;
    }
  }
}
