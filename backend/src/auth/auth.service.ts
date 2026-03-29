import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './strategies/jwt.strategy';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) return { role: 'GUEST', permissions: [] };

    const roleName = user.role?.name || 'GUEST';
    const rolePermissions =
      user.role?.permissions.map((rp) => rp.permission.name) || [];
    const userDirectPermissions = user.userPermissions.map(
      (up) => up.permission.name,
    );
    const allPermissions = Array.from(
      new Set([...rolePermissions, ...userDirectPermissions]),
    );

    return { role: roleName, permissions: allPermissions };
  }

  private async generateTokens(payload: JwtPayload) {
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

  private setCookie(
    response: Response,
    name: string,
    token: string,
    maxAge: number,
  ) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    response.cookie(name, token, {
      httpOnly: true,
      secure: isProduction, // Set to true if using HTTPS
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge,
      // Enterprise: domain should be dynamic if multi-subdomain SaaS
      // domain: isProduction ? '.yourdomain.com' : 'localhost',
    });
  }

  async register(registerDto: RegisterDto, response: Response) {
    const { email, username, password, roleId } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: roleId || null,
      },
      include: { role: true },
    });

    const { role, permissions } = await this.getUserPermissions(user.id);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role,
      permissions,
      tenantId: user.tenantId,
    };
    const { accessToken, refreshToken } = await this.generateTokens(payload);

    await this.storeRefreshToken(user.id, refreshToken);

    this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
    this.setCookie(
      response,
      'refreshToken',
      refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );

    return {
      user: { ...user, role, permissions },
      message: 'Registration successful',
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { username } });

    if (!user) return null;

    // Check if account is locked
    if (
      user.status === 'LOCKED' &&
      user.lockUntil &&
      user.lockUntil > new Date()
    ) {
      throw new UnauthorizedException(
        'Account is locked. Please try again later.',
      );
    }

    if (await bcrypt.compare(password, user.password)) {
      // Reset failed attempts on success
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null, status: 'ACTIVE' },
      });
      const { password: _, ...result } = user;
      return result;
    }

    // Handle failed login
    const failedAttempts = user.failedLoginAttempts + 1;
    const data: any = { failedLoginAttempts: failedAttempts };

    if (failedAttempts >= 5) {
      data.status = 'LOCKED';
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      data.lockUntil = lockUntil;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data,
    });

    return null;
  }

  async login(user: any, response: Response) {
    const { role, permissions } = await this.getUserPermissions(user.id);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role,
      permissions,
      tenantId: user.tenantId,
    };
    const { accessToken, refreshToken } = await this.generateTokens(payload);

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
      message: 'Login successful',
    };
  }

  async refresh(oldRefreshToken: string, response: Response) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const storedToken = await this.prisma.refreshToken.findFirst({
        where: { token: oldRefreshToken, revoked: false },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Revoke old token (Rotation)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      const { role, permissions } = await this.getUserPermissions(payload.sub);
      const newPayload: JwtPayload = {
        sub: payload.sub,
        username: payload.username,
        email: payload.email,
        role,
        permissions,
        tenantId: payload.tenantId,
      };
      const { accessToken, refreshToken } =
        await this.generateTokens(newPayload);

      await this.storeRefreshToken(payload.sub, refreshToken);

      this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
      this.setCookie(
        response,
        'refreshToken',
        refreshToken,
        7 * 24 * 60 * 60 * 1000,
      );

      return { message: 'Tokens refreshed' };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(response: Response, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }

    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    return { message: 'Logout successful' };
  }

  private async storeRefreshToken(userId: number, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

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
        where: { code: user.username, tenantId: user.tenantId },
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
