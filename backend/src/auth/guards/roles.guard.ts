import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../dto/register.dto';
import { ROLES_KEY } from '../decorators/roles.decorator';

import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest();
        const { user } = request;

        if (!user) {
            return false;
        }

        // Check if user is deleted (Soft delete check)
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { deletedAt: true },
        });

        if (!dbUser || dbUser.deletedAt) {
            throw new ForbiddenException('Your account has been deactivated');
        }

        if (!requiredRoles) {
            return true;
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}
