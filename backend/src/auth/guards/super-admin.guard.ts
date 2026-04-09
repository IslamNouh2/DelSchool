import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    role: string;
    tenantId: string | null;
  };
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // A Super Admin is an ADMIN role with NO tenantId (or a specific platform tenantId)
    // Here we check for role ADMIN and null/empty tenantId
    if (
      user &&
      user.role === 'ADMIN' &&
      (!user.tenantId || user.tenantId === 'SYSTEM')
    ) {
      return true;
    }

    throw new ForbiddenException('Access denied. Super Admin only.');
  }
}
