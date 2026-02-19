import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto, Role } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './strategies/jwt.strategy';
import { Response } from 'express';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

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

    private setCookie(response: Response, name: string, token: string, maxAge: number) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        response.cookie(name, token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            path: '/',
            maxAge,
        });
    }

    async register(registerDto: RegisterDto, response: Response) {
        const { email, username, password, role } = registerDto;

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
                role: role || Role.STUDENT,
            },
            select: { id: true, email: true, username: true, role: true },
        });

        const payload: JwtPayload = { sub: user.id, username: user.username, email: user.email, role: user.role };
        const { accessToken, refreshToken } = this.generateTokens(payload);

        await this.storeRefreshToken(user.id, refreshToken);

        this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
        this.setCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000);

        return { user, message: 'Registration successful' };
    }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any, response: Response) {
        const payload: JwtPayload = { sub: user.id, username: user.username, email: user.email, role: user.role };
        const { accessToken, refreshToken } = this.generateTokens(payload);

        await this.storeRefreshToken(user.id, refreshToken);

        this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
        this.setCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000);

        return {
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
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

            const newPayload: JwtPayload = { sub: payload.sub, username: payload.username, email: payload.email, role: payload.role };
            const { accessToken, refreshToken } = this.generateTokens(newPayload);

            await this.storeRefreshToken(payload.sub, refreshToken);

            this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
            this.setCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000);

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
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, username: true, role: true },
        });
    }
}
