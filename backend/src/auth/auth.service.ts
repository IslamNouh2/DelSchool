import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface UserResult {
  id: number;
  email: string;
  username: string;
  roleId: number | null;
  tenantId: string | null;
  status: string;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedUser extends UserResult {
  role: string;
  permissions: string[];
  profileId?: number | null;
}

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ======== PERMISSIONS & ROLE ========
  private async getUserPermissions(
    userId: number,
  ): Promise<{ role: string; permissions: string[] }> {
    const cacheKey = `user_permissions:${userId}`;
    const cached = await this.cacheManager.get<{
      role: string;
      permissions: string[];
    }>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            name: true,
            permissions: { select: { permission: { select: { name: true } } } },
          },
        },
        userPermissions: { select: { permission: { select: { name: true } } } },
      },
    });

    if (!user) {
      const result = { role: 'GUEST', permissions: [] };
      await this.cacheManager.set(cacheKey, result, 300000); // 5 min
      return result;
    }

    const roleName = user.role?.name || 'GUEST';
    const rolePermissions =
      user.role?.permissions.map((p) => p.permission.name) || [];
    const userPermissions = user.userPermissions.map((p) => p.permission.name);
    const allPermissions = Array.from(
      new Set([...rolePermissions, ...userPermissions]),
    );

    const result = { role: roleName, permissions: allPermissions };
    await this.cacheManager.set(cacheKey, result, 300000); // 5 min
    return result;
  }

  // ======== PROFILE RESOLUTION ========
  private async resolveProfileId(
    username: string,
    roleName: string,
    tenantId: string | null,
  ): Promise<number | null> {
    const cacheKey = `profile_id:${username}:${tenantId || 'global'}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached !== undefined && cached !== null) return cached;

    let profileId: number | null = null;

    if (roleName === 'STUDENT') {
      const student = await this.prisma.student.findFirst({
        where: { code: username, tenantId: tenantId || undefined },
        select: { studentId: true },
      });
      profileId = student?.studentId || null;
    } else if (roleName === 'TEACHER') {
      const employer = await this.prisma.employer.findFirst({
        where: {
          code: username,
          tenantId: tenantId || undefined,
          type: 'teacher',
        },
        select: { employerId: true },
      });
      profileId = employer?.employerId || null;
    }

    if (profileId !== null) {
      await this.cacheManager.set(cacheKey, profileId, 3600000); // 1 hour
    }
    return profileId;
  }

  // ======== TOKEN GENERATION ========
  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: crypto.randomUUID() },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    return { accessToken, refreshToken };
  }

  // ======== COOKIE SETTER ========
  private setCookie(
    response: Response,
    name: string,
    token: string,
    maxAge: number,
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    response.cookie(name, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge,
    });
  }

  // ======== REGISTER ========
  async register(registerDto: RegisterDto, response: Response) {
    const { email, username, password } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) throw new ConflictException('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Hardcode role to STUDENT (3) for public registration to prevent privilege escalation
    const STUDENT_ROLE_ID = 3;

    const user: UserWithRole = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: STUDENT_ROLE_ID,
        tokenVersion: 0,
      },
      include: { role: true },
    });

    const { role, permissions } = await this.getUserPermissions(user.id);
    const profileId = await this.resolveProfileId(
      user.username,
      role,
      user.tenantId,
    );

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: role,
      roleId: user.roleId,
      tenantId: user.tenantId,
      permissions: permissions,
      profileId: profileId,
      tokenVersion: user.tokenVersion || 0,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);
    await this.storeRefreshToken(user.id, refreshToken);

    this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
    this.setCookie(
      response,
      'refreshToken',
      refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );

    return {
      user: { ...user, role, permissions, profileId },
      accessToken,
      message: 'Registration successful',
    };
  }

  // ======== VALIDATE USER ========
  async validateUser(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    // 🔥 Hydrate EVERYTHING in one query to avoid N+1 and redundant DB roundtrips
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        status: true,
        lockUntil: true,
        failedLoginAttempts: true,
        tenantId: true,
        roleId: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: { select: { name: true } },
              },
            },
          },
        },
        userPermissions: {
          select: {
            permission: { select: { name: true } },
          },
        },
      },
    });

    if (!user) return null;

    if (
      user.status === 'LOCKED' &&
      user.lockUntil &&
      user.lockUntil > new Date()
    ) {
      throw new UnauthorizedException('Account locked. Try later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // Construction of permissions (moved from getUserPermissions to keep logic local)
      const roleName = user.role?.name || 'GUEST';
      const rolePermissions =
        user.role?.permissions.map((p) => p.permission.name) || [];
      const directUserPermissions = user.userPermissions.map(
        (p) => p.permission.name,
      );
      const allPermissions = Array.from(
        new Set([...rolePermissions, ...directUserPermissions]),
      );

      // 🔥 FIRE AND FORGET updates: Don't block the login response for non-critical logging
      const rounds = bcrypt.getRounds(user.password);
      const updateData: Prisma.UserUpdateInput = {
        failedLoginAttempts: 0,
        lockUntil: null,
        status: 'ACTIVE',
      };

      const needsUpdate =
        user.failedLoginAttempts > 0 ||
        user.lockUntil !== null ||
        user.status !== 'ACTIVE';

      // Progressive rehash logic - ONLY if necessary
      if (rounds < 10) {
        void bcrypt.hash(password, 10).then((newHash) => {
          this.prisma.user
            .update({
              where: { id: user.id },
              data: { ...updateData, password: newHash },
            })
            .catch((err) => console.error('Failed to rehash password:', err));
        });
      } else if (needsUpdate) {
        void this.prisma.user
          .update({
            where: { id: user.id },
            data: updateData,
          })
          .catch((err) => console.error('Failed to update user status:', err));
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        tenantId: user.tenantId,
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        lockUntil: null,
        tokenVersion: user.tokenVersion,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: roleName,
        permissions: allPermissions,
      };
    }

    // Logic for failed login attempt (Synchronous as it impacts security/locking)
    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData: Prisma.UserUpdateInput = {
      failedLoginAttempts: failedAttempts,
    };

    if (failedAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      updateData.status = 'LOCKED';
      updateData.lockUntil = lockUntil;
    }

    await this.prisma.user.update({ where: { id: user.id }, data: updateData });
    return null;
  }

  // ======== LOGIN ========
  async login(user: AuthenticatedUser, response: Response) {
    // 🔥 Resolved metadata was passed from validateUser via LocalStrategy
    // Only resolve profileId if not already present (can be cached)
    const profileId =
      user.profileId ??
      (await this.resolveProfileId(user.username, user.role, user.tenantId));

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleId: user.roleId,
      tenantId: user.tenantId,
      permissions: user.permissions,
      profileId: profileId,
      tokenVersion: user.tokenVersion,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    // 🔥 Don't block response for token storage (IO intensive)
    void this.storeRefreshToken(user.id, refreshToken).catch((err) =>
      console.error('Failed to store refresh token:', err),
    );

    // Cache token version for fast validation in strategy
    await this.cacheManager.set(
      `token_version:${user.id}`,
      user.tokenVersion,
      3600000,
    );

    this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
    this.setCookie(
      response,
      'refreshToken',
      refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        profileId: profileId,
        tenantId: user.tenantId,
      },
      accessToken,
      message: 'Login successful',
    };
  }

  // ======== REFRESH TOKEN ========
  async refresh(oldRefreshToken: string, response: Response) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(oldRefreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Invalid token version');
      }

      const hashedIncoming = crypto
        .createHash('sha256')
        .update(oldRefreshToken)
        .digest('hex');

      // 1. Fast path: Direct lookup by SHA-256 hash
      let matchedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: hashedIncoming,
          userId: payload.sub,
          revoked: false,
        },
      });

      // 2. Slow path: Fallback for old bcrypt tokens
      if (!matchedToken) {
        const activeTokens = await this.prisma.refreshToken.findMany({
          where: { userId: payload.sub, revoked: false },
        });

        for (const tokenRecord of activeTokens) {
          const isBcrypt =
            tokenRecord.token.startsWith('$2a$') ||
            tokenRecord.token.startsWith('$2b$');

          if (
            isBcrypt &&
            (await bcrypt.compare(oldRefreshToken, tokenRecord.token))
          ) {
            matchedToken = tokenRecord;
            break;
          }
        }
      }

      if (!matchedToken || matchedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      await this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revoked: true },
      });

      const [permissionsInfo, profileId] = await Promise.all([
        this.getUserPermissions(payload.sub),
        this.resolveProfileId(
          user.username,
          user.role?.name || 'GUEST',
          user.tenantId,
        ),
      ]);

      const newPayload: JwtPayload = {
        sub: payload.sub,
        username: user.username,
        email: user.email,
        role: permissionsInfo.role,
        roleId: user.roleId,
        tenantId: user.tenantId,
        permissions: permissionsInfo.permissions,
        profileId: profileId,
        tokenVersion: user.tokenVersion,
      };

      const { accessToken, refreshToken } = this.generateTokens(newPayload);
      await this.storeRefreshToken(payload.sub, refreshToken);

      // Refresh cache for faster lookup
      await this.cacheManager.set(
        `token_version:${user.id}`,
        user.tokenVersion,
        3600000,
      );

      this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
      this.setCookie(
        response,
        'refreshToken',
        refreshToken,
        7 * 24 * 60 * 60 * 1000,
      );

      return { message: 'Tokens refreshed', accessToken };
    } catch (err) {
      console.error('Refresh error:', err);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ======== LOGOUT ========
  async logout(
    response: Response,
    userId: number,
    refreshToken?: string,
    logoutAll: boolean = false,
  ) {
    if (logoutAll) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    } else if (refreshToken) {
      const hashedIncoming = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // 1. Try fast path direct lookup
      const matchedToken = await this.prisma.refreshToken.findFirst({
        where: {
          token: hashedIncoming,
          userId,
          revoked: false,
        },
      });

      if (matchedToken) {
        await this.prisma.refreshToken.update({
          where: { id: matchedToken.id },
          data: { revoked: true },
        });
      } else {
        // 2. Slow path fallback for bcrypt
        const tokens = await this.prisma.refreshToken.findMany({
          where: { userId, revoked: false },
        });

        for (const t of tokens) {
          const isBcrypt =
            t.token.startsWith('$2a$') || t.token.startsWith('$2b$');

          if (isBcrypt && (await bcrypt.compare(refreshToken, t.token))) {
            await this.prisma.refreshToken.update({
              where: { id: t.id },
              data: { revoked: true },
            });
            break;
          }
        }
      }
    }

    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    return { message: 'Logout successful' };
  }

  // ======== STORE REFRESH TOKEN ========
  private async storeRefreshToken(userId: number, token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: hashedToken, userId, expiresAt },
    });
  }

  // ======== GET PROFILE ========
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return null;

    const roleName = user.role?.name || 'GUEST';
    let profileId: number | null = null;

    if (roleName === 'STUDENT') {
      const student = await this.prisma.student.findFirst({
        where: { code: user.username, tenantId: user.tenantId || undefined },
      });
      profileId = student?.studentId || null;
    } else if (roleName === 'TEACHER') {
      const employer = await this.prisma.employer.findFirst({
        where: {
          code: user.username,
          tenantId: user.tenantId,
          type: 'teacher',
        },
      });
      profileId = employer?.employerId || null;
    }

    return { ...user, profileId, roleName };
  }
}
