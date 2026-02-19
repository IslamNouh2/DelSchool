

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
        return req.cookies['accessToken']; // ✅ match the new AuthService cookie name
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
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET')
        });
    }

    async validate(payload: JwtPayload) {
        console.log('Validating payload:', payload);
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, username: true, email: true, role: true },
        });

        if (!user) {
            console.log('User not found in DB for sub:', payload.sub);
            throw new UnauthorizedException();
        }

        console.log('User validated successfully:', user.username);
        return user;
    }
}