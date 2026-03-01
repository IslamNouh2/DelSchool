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
exports.ClassService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("src/socket/socket.gateway");
let ClassService = class ClassService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    ;
    async GetClasses(tenantId, page = 1, limit = 10, orderByField = 'dateCreate', search) {
        const skip = (page - 1) * limit;
        const where = {
            tenantId, // Enforce tenant
            ...(search ? {
                OR: [
                    { ClassName: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ],
            } : {})
        };
        const [classes, total] = await this.prisma.$transaction([
            this.prisma.classes.findMany({
                where,
                orderBy: {
                    [orderByField]: 'desc',
                },
                include: {
                    local: true,
                    translations: true,
                },
                skip,
                take: limit,
            }),
            this.prisma.classes.count({ where }),
        ]);
        return {
            classes,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async CreateClass(tenantId, dto) {
        const { ClassName, code, okBlock, localName, NumStudent, } = dto;
        // Get the local by its name and tenantId
        const local = await this.prisma.local.findFirst({
            where: {
                name: localName,
                tenantId // Enforce tenant
            },
        });
        if (!local) {
            throw new Error(`errors.local_not_found`);
        }
        // Capacity Check
        if (local.size > 0) {
            const currentTotal = await this.prisma.classes.aggregate({
                where: { localId: local.localId, tenantId }, // Enforce tenant
                _sum: { NumStudent: true }
            });
            const total = (currentTotal._sum.NumStudent || 0) + NumStudent;
            if (total > local.size) {
                throw new Error(`errors.local_capacity_exceeded`);
            }
        }
        // NumClass Check
        if (local.NumClass && local.NumClass > 0) {
            const classCount = await this.prisma.classes.count({
                where: { localId: local.localId, tenantId } // Enforce tenant
            });
            if (classCount >= local.NumClass) {
                throw new Error(`errors.local_class_limit_reached`);
            }
        }
        // Create the class using the resolved localId
        const Classe = await this.prisma.classes.create({
            data: {
                ClassName,
                localId: local.localId,
                code,
                NumStudent,
                okBlock,
                tenantId, // Store tenantId
                cloture: dto.cloture === true,
                translations: dto.translations ? {
                    create: Object.entries(dto.translations).map(([locale, name]) => ({
                        locale,
                        name: name,
                    })),
                } : undefined,
            },
            include: { translations: true }
        });
        this.socketGateway.emitRefresh();
        return Classe;
    }
    async UpdateLocal(tenantId, id, dto) {
        const { ClassName, code, okBlock, localName, NumStudent, } = dto;
        const local = await this.prisma.local.findFirst({
            where: {
                name: localName,
                tenantId // Enforce tenant
            },
        });
        if (!local) {
            throw new Error(`errors.local_not_found`);
        }
        // Capacity Check
        if (local.size > 0) {
            const currentTotal = await this.prisma.classes.aggregate({
                where: {
                    localId: local.localId,
                    tenantId, // Enforce tenant
                    NOT: { classId: id } // Exclude this class from its own total
                },
                _sum: { NumStudent: true }
            });
            const total = (currentTotal._sum.NumStudent || 0) + NumStudent;
            if (total > local.size) {
                throw new Error(`errors.local_capacity_exceeded`);
            }
        }
        // NumClass Check
        if (local.NumClass && local.NumClass > 0) {
            const currentClassCount = await this.prisma.classes.count({
                where: {
                    localId: local.localId,
                    tenantId, // Enforce tenant
                    NOT: { classId: id } // Exclude this class
                }
            });
            if (currentClassCount >= local.NumClass) {
                throw new Error(`❌ Local class limit reached. Maximum classes allowed: ${local.NumClass}`);
            }
        }
        const Classe = await this.prisma.classes.update({
            where: { classId: id, tenantId }, // Enforce tenant
            data: {
                ClassName,
                localId: local.localId,
                code,
                NumStudent,
                okBlock,
                cloture: dto.cloture !== undefined ? dto.cloture : undefined,
                translations: dto.translations ? {
                    deleteMany: {},
                    create: Object.entries(dto.translations).map((l) => ({
                        locale: l[0],
                        name: l[1],
                    })),
                } : undefined,
            },
            include: { translations: true }
        });
        this.socketGateway.emitRefresh();
        return Classe;
    }
    async DeleteLocal(tenantId, id) {
        const classe = await this.prisma.classes.findUnique({
            where: { classId: id, tenantId } // Enforce tenant
        });
        if (!classe) {
            throw new Error('Class NOT FOUND');
        }
        await this.prisma.classes.delete({
            where: { classId: id, tenantId } // Enforce tenant
        });
        this.socketGateway.emitRefresh();
    }
};
exports.ClassService = ClassService;
exports.ClassService = ClassService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof socket_gateway_1.SocketGateway !== "undefined" && socket_gateway_1.SocketGateway) === "function" ? _b : Object])
], ClassService);
