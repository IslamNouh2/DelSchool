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
var EventService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
let EventService = EventService_1 = class EventService {
    prisma;
    logger = new common_1.Logger(EventService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        return this.prisma.event.create({
            data: {
                ...dto,
                tenantId, // Enforce tenant
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
            },
        });
    }
    async findAll(tenantId, role) {
        try {
            const where = { tenantId };
            // If student, only show public events
            if (role === 'STUDENT') {
                where.isPublic = true;
            }
            return await this.prisma.event.findMany({
                where,
                orderBy: { startTime: 'asc' },
            });
        }
        catch (error) {
            this.logger.error('Error in EventService.findAll:', error);
            throw error;
        }
    }
    async findOne(tenantId, id) {
        const event = await this.prisma.event.findFirst({
            where: { id, tenantId },
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }
    async update(tenantId, id, dto) {
        const data = { ...dto };
        if (dto.startTime)
            data.startTime = new Date(dto.startTime);
        if (dto.endTime)
            data.endTime = new Date(dto.endTime);
        try {
            return await this.prisma.event.update({
                where: { id }, // id is unique globally but we check tenant in findOne or can add it to where
                data: {
                    ...data,
                    tenantId, // Optional but good for consistency
                },
            });
        }
        catch (error) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
    }
    async remove(tenantId, id) {
        try {
            // Check existence and tenant
            await this.findOne(tenantId, id);
            await this.prisma.event.delete({
                where: { id },
            });
            return { message: 'Event deleted successfully' };
        }
        catch (error) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
    }
};
exports.EventService = EventService;
exports.EventService = EventService = EventService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], EventService);
