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
exports.SubjectLocalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("../socket/socket.gateway");
let SubjectLocalService = class SubjectLocalService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    ;
    async bulkInsert(tenantId, dto) {
        const { localId, subjectIds } = dto;
        const records = subjectIds.map((subjectId) => ({
            localId,
            subjectId,
            cloture: false,
            dateCreate: new Date(),
            tenantId, // Enforce tenant
        }));
        const result = await this.prisma.subject_local.createMany({
            data: records,
            skipDuplicates: true,
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    async getSubjectsByLocal(tenantId, localId) {
        return this.prisma.subject_local.findMany({
            where: {
                localId: Number(localId),
                tenantId // Enforce tenant
            },
            include: {
                subject: true, // includes subject details (name, etc.)
            },
        });
    }
    async removeSubjectFromLocal(tenantId, localId, subjectId) {
        const record = await this.prisma.subject_local.findFirst({
            where: {
                localId,
                subjectId,
                tenantId // Enforce tenant
            },
        });
        if (!record) {
            throw new common_1.NotFoundException('Subject not assigned to this local.');
        }
        const result = await this.prisma.subject_local.delete({
            where: {
                subjectLocalId: record.subjectLocalId,
            },
        });
        this.socketGateway.emitRefresh();
        return { message: 'Subject removed from local successfully.' };
    }
};
exports.SubjectLocalService = SubjectLocalService;
exports.SubjectLocalService = SubjectLocalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, socket_gateway_1.SocketGateway])
], SubjectLocalService);
