"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const register_dto_1 = require("./dto/register.dto");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    generateTokens(payload) {
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
    setCookie(response, name, token, maxAge) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        response.cookie(name, token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            path: '/',
            maxAge,
        });
    }
    async register(registerDto, response) {
        const { email, username, password, role } = registerDto;
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                role: role || register_dto_1.Role.STUDENT,
            },
            select: { id: true, email: true, username: true, role: true, tenantId: true },
        });
        const payload = { sub: user.id, username: user.username, email: user.email, role: user.role, tenantId: user.tenantId };
        const { accessToken, refreshToken } = this.generateTokens(payload);
        await this.storeRefreshToken(user.id, refreshToken);
        this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
        this.setCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000);
        return { user, message: 'Registration successful' };
    }
    async validateUser(username, password) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user, response) {
        const payload = { sub: user.id, username: user.username, email: user.email, role: user.role, tenantId: user.tenantId };
        const { accessToken, refreshToken } = this.generateTokens(payload);
        await this.storeRefreshToken(user.id, refreshToken);
        this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
        this.setCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000);
        return {
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
            message: 'Login successful',
        };
    }
    async refresh(oldRefreshToken, response) {
        try {
            const payload = this.jwtService.verify(oldRefreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const storedToken = await this.prisma.refreshToken.findFirst({
                where: { token: oldRefreshToken, revoked: false },
            });
            if (!storedToken || storedToken.expiresAt < new Date()) {
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            }
            // Revoke old token (Rotation)
            await this.prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revoked: true },
            });
            const newPayload = {
                sub: payload.sub,
                username: payload.username,
                email: payload.email,
                role: payload.role,
                tenantId: payload.tenantId
            };
            const { accessToken, refreshToken } = this.generateTokens(newPayload);
            await this.storeRefreshToken(payload.sub, refreshToken);
            this.setCookie(response, 'accessToken', accessToken, 15 * 60 * 1000);
            this.setCookie(response, 'refreshToken', refreshToken, 7 * 24 * 60 * 60 * 1000);
            return { message: 'Tokens refreshed' };
        }
        catch (e) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(response, refreshToken) {
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
    async storeRefreshToken(userId, token) {
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
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, username: true, role: true, tenantId: true },
        });
        if (!user)
            return null;
        let profileId = null;
        if (user.role === 'STUDENT') {
            const student = await this.prisma.student.findFirst({
                where: { code: user.username, tenantId: user.tenantId }
            });
            profileId = student?.studentId || null;
        }
        else if (user.role === 'TEACHER') {
            const employer = await this.prisma.employer.findFirst({
                where: { code: user.username, tenantId: user.tenantId, type: 'teacher' }
            });
            profileId = employer?.employerId || null;
        }
        return { ...user, profileId };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
