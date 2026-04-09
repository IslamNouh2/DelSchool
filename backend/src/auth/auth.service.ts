import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
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
  ) {}

  // ======== PERMISSIONS & ROLE ========
  private async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        userPermissions: { include: { permission: true } },
      },
    });

    if (!user) return { role: 'GUEST', permissions: [] };

    const roleName = user.role?.name || 'GUEST';
    const rolePermissions =
      user.role?.permissions.map((p) => p.permission.name) || [];
    const userPermissions = user.userPermissions.map((p) => p.permission.name);
    const allPermissions = Array.from(
      new Set([...rolePermissions, ...userPermissions]),
    );

    return { role: roleName, permissions: allPermissions };
  }

  // ======== TOKEN GENERATION ========
  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

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

    const hashedPassword = await bcrypt.hash(password, 12);

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

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role?.name || 'GUEST',
      tenantId: user.tenantId,
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

    const { role, permissions } = await this.getUserPermissions(user.id);

    return {
      user: { ...user, role, permissions },
      accessToken,
      message: 'Registration successful',
    };
  }

  // ======== VALIDATE USER ========
  async validateUser(
    username: string,
    password: string,
  ): Promise<UserResult | null> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) return null;

    if (
      user.status === 'LOCKED' &&
      user.lockUntil &&
      user.lockUntil > new Date()
    ) {
      throw new UnauthorizedException('Account locked. Try later.');
    }

    if (await bcrypt.compare(password, user.password)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null, status: 'ACTIVE' },
      });
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
      };
    }

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
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser) throw new UnauthorizedException('User not found');

    const { role, permissions } = await this.getUserPermissions(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      role,
      tenantId: dbUser.tenantId,
      tokenVersion: dbUser.tokenVersion,
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role,
        permissions,
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
      });
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Invalid token version');
      }

      const activeTokens = await this.prisma.refreshToken.findMany({
        where: { userId: payload.sub, revoked: false },
      });

      let matchedToken: (typeof activeTokens)[0] | null = null;
      for (const tokenRecord of activeTokens) {
        if (await bcrypt.compare(oldRefreshToken, tokenRecord.token)) {
          matchedToken = tokenRecord;
          break;
        }
      }

      if (!matchedToken || matchedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      await this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revoked: true },
      });

      const { role } = await this.getUserPermissions(payload.sub);
      const newPayload: JwtPayload = {
        sub: payload.sub,
        role,
        tenantId: user.tenantId,
        tokenVersion: user.tokenVersion,
      };

      const { accessToken, refreshToken } = this.generateTokens(newPayload);
      await this.storeRefreshToken(payload.sub, refreshToken);

      this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
      this.setCookie(
        response,
        'refreshToken',
        refreshToken,
        7 * 24 * 60 * 60 * 1000,
      );

      return { message: 'Tokens refreshed', accessToken };
    } catch {
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
      const tokens = await this.prisma.refreshToken.findMany({
        where: { userId, revoked: false },
      });
      for (const t of tokens) {
        if (await bcrypt.compare(refreshToken, t.token)) {
          await this.prisma.refreshToken.update({
            where: { id: t.id },
            data: { revoked: true },
          });
          break;
        }
      }
    }

    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    return { message: 'Logout successful' };
  }

  // ======== STORE REFRESH TOKEN ========
  private async storeRefreshToken(userId: number, token: string) {
    const hashedToken = await bcrypt.hash(token, 12);
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
