import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    // 1. Production performance: check token version in Redis/Cache
    let currentVersion = await this.cacheManager.get<number>(
      `token_version:${payload.sub}`,
    );

    // 2. Defensive fallback: if cache is empty, check DB once
    if (currentVersion === undefined || currentVersion === null) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { tokenVersion: true, status: true },
      });

      if (!user || user.status === 'LOCKED') {
        throw new UnauthorizedException(
          !user ? 'Unauthorized' : 'Account is locked',
        );
      }

      currentVersion = user.tokenVersion;
      // Populate cache to prevent cascading DB hits under high load
      await this.cacheManager.set(
        `token_version:${payload.sub}`,
        currentVersion,
        3600000,
      );
    }

    // 3. Invalidate if version mismatched (e.g. user changed password/role)
    if (currentVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    // 4. Return user from payload - ZERO DB calls from here on!
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      roleId: payload.roleId,
      permissions: payload.permissions,
      profileId: payload.profileId,
      tenantId: payload.tenantId,
    };
  }
}
