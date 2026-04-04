import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// Custom JWT extractor function to get token from cookies
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return (req.cookies['accessToken'] as string) || null;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || user.status === 'LOCKED') {
      throw new UnauthorizedException(
        user?.status === 'LOCKED' ? 'Account is locked' : 'Unauthorized',
      );
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    const roleName = user.role?.name || 'GUEST';
    const rolePermissions =
      user.role?.permissions.map((rp) => rp.permission.name) || [];
    const userDirectPermissions = user.userPermissions.map(
      (up) => up.permission.name,
    );
    const allPermissions = Array.from(
      new Set([...rolePermissions, ...userDirectPermissions]),
    );

    return {
      id: user.id,
      role: roleName,
      permissions: allPermissions,
      tenantId: user.tenantId,
    };
  }
}
