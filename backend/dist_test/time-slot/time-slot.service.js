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
exports.TimeSlotService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("../socket/socket.gateway");
let TimeSlotService = class TimeSlotService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    async create(tenantId, dto) {
        const result = await this.prisma.timeSlot.create({
            data: { ...dto, tenantId }
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    findAll(tenantId) {
        return this.prisma.timeSlot.findMany({
            where: { tenantId },
            orderBy: { startTime: 'asc' }
        });
    }
    async update(tenantId, id, dto) {
        const result = await this.prisma.timeSlot.update({
            where: { id, tenantId },
            data: dto
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    async remove(tenantId, id) {
        const result = await this.prisma.timeSlot.delete({
            where: { id, tenantId }
        });
        this.socketGateway.emitRefresh();
        return result;
    }
};
exports.TimeSlotService = TimeSlotService;
exports.TimeSlotService = TimeSlotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, socket_gateway_1.SocketGateway])
], TimeSlotService);
