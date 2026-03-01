"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("prisma/prisma.service");
// Custom JWT extractor function to get token from cookies
const cookieExtractor = (req) => {
    if (req && req.cookies) {
        return req.cookies['accessToken']; // ✅ match the new AuthService cookie name
    }
    return null;
};
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    prisma;
    constructor(configService, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                cookieExtractor,
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET')
        });
        this.configService = configService;
        this.prisma = prisma;
    }
    async validate(payload) {
        console.log('Validating payload:', payload);
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, username: true, email: true, role: true, tenantId: true },
        });
        if (!user) {
            console.log('User not found in DB for sub:', payload.sub);
            throw new common_1.UnauthorizedException();
        }
        console.log('User validated successfully:', user.username);
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], JwtStrategy);
