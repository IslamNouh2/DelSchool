

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

export interface JwtPayload {
    sub: number;
    username: string;
    email: string;
    role: Role;
}

// Custom JWT extractor function to get token from cookies
const cookieExtractor = (req: Request): string | null => {
    if (req && req.cookies) {
        return req.cookies['token']; // ✅ match the AuthService
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
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET')
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, username: true, email: true, role: true },
        });

        if (!user) {
            console.log('User not found for payload:', payload);
            throw new UnauthorizedException();
        }

        return user;
    }
}