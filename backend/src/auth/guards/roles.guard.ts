import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const { user } = request;

        if (!user || !user.role) {
            return false;
        }

        // Basic check for exact role match
        // In a more advanced implementation, we would check the role hierarchy in the DB
        const hasRole = requiredRoles.includes(user.role);
        
        if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}

