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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../decorators/public.decorator");
let TenantGuard = class TenantGuard {
    jwtService;
    reflector;
    constructor(jwtService, reflector) {
        this.jwtService = jwtService;
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const token = request.cookies?.accessToken || request.headers.authorization?.split(' ')[1];
        if (!token) {
            // Let other guards (like JwtAuthGuard) handle the "no token" case.
            // TenantGuard should only enforce tenant logic if a token is actually present.
            return true;
        }
        try {
            const payload = this.jwtService.decode(token);
            // If we can't decode it, or it doesn't have a tenantId, we might be in transition.
            // In a strict multi-tenant system, we should throw. 
            // For now, we'll attach 'default-tenant' or let it pass if we want to be lenient.
            if (payload && payload.tenantId) {
                request.tenantId = payload.tenantId;
                request.user = payload;
            }
            else {
                // Log warning or handle transition
                console.warn('Token present but missing tenantId. Using fallback or passing through.');
                request.tenantId = 'default-tenant';
            }
            return true;
        }
        catch (e) {
            // Decode failed, let it pass and let JwtAuthGuard handle the invalidity
            return true;
        }
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector])
], TenantGuard);
