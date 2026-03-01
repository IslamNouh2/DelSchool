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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("src/socket/socket.gateway");
let LocalService = class LocalService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    ;
    async GetLocal(tenantId, page = 1, limit = 10, orderByField, search) {
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [locals, total] = await this.prisma.$transaction([
            this.prisma.local.findMany({
                where,
                orderBy: {
                    [orderByField]: 'asc',
                },
                skip,
                take: limit,
                include: {
                    subject_local: {
                        include: {
                            subject: true,
                        }
                    }
                },
            }),
            this.prisma.local.count({ where }),
        ]);
        return {
            locals,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async CreateLocal(tenantId, dto) {
        const { NumClass, name, code, } = dto;
        const Locals = await this.prisma.local.create({
            data: {
                NumClass,
                name,
                code,
                size: dto.size || 0,
                tenantId,
            },
        });
        this.socketGateway.emitRefresh();
        return Locals;
    }
    async UpdateLocal(tenantId, id, dto) {
        const { NumClass, name, code, } = dto;
        const Locals = await this.prisma.local.update({
            where: { localId: id, tenantId },
            data: {
                NumClass,
                name,
                code,
                size: dto.size !== undefined ? dto.size : undefined,
            },
        });
        this.socketGateway.emitRefresh();
        return Locals;
    }
    async DeleteLocal(tenantId, id) {
        const local = await this.prisma.local.findUnique({ where: { localId: id, tenantId } });
        if (!local) {
            throw new Error('LOCAL NOT FOUND');
        }
        await this.prisma.local.delete({ where: { localId: id, tenantId } });
        this.socketGateway.emitRefresh();
    }
    async CountLocals(tenantId) {
        const count = await this.prisma.local.count({ where: { tenantId } });
        return count;
    }
    async getAllLocals(tenantId) {
        return this.prisma.local.findMany({
            where: { tenantId },
            include: {
                classes: true
            }
        });
    }
};
exports.LocalService = LocalService;
exports.LocalService = LocalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof socket_gateway_1.SocketGateway !== "undefined" && socket_gateway_1.SocketGateway) === "function" ? _b : Object])
], LocalService);
