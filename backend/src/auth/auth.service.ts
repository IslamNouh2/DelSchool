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

    private setTokenCookie(response: Response, token: string) {
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');

        let maxAge = 7 * 24 * 60 * 60 * 1000;
        if (expiresIn.includes('d')) maxAge = parseInt(expiresIn) * 24 * 60 * 60 * 1000;
        else if (expiresIn.includes('h')) maxAge = parseInt(expiresIn) * 60 * 60 * 1000;

        const isProduction = process.env.NODE_ENV === 'production';

        response.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,         // only secure in production
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
            maxAge,
        });
    }


    async register(registerDto: RegisterDto, response: Response) {
        const { email, username, password, role } = registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            throw new ConflictException('User with this email or username already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                role: role || Role.STUDENT,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
            },
        });

        // Generate JWT token
        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        const token = this.jwtService.sign(payload);

        // Set token in HTTP-only cookie
        this.setTokenCookie(response, token);

        return {
            user,
            message: 'Registration successful',
        };
    }

    async validateUser(username: string, password: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any, response: Response) {
        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        const token = this.jwtService.sign(payload);

        // Set token in HTTP-only cookie
        this.setTokenCookie(response, token);

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            message: 'Login successful',
        };
    }

    async logout(response: Response) {
        response.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
        });
        return {
            message: 'Logout successful',
        };
    }

    async getProfile(userId: number) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
            },
        });
    }
}