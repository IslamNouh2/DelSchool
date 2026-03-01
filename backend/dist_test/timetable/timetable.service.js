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
exports.TimetableService = void 0;
const prisma_service_1 = require("prisma/prisma.service");
const common_1 = require("@nestjs/common");
const socket_gateway_1 = require("../socket/socket.gateway");
let TimetableService = class TimetableService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    async create(tenantId, dto) {
        return this.prisma.$transaction(async (tx) => {
            // ✅ 1. Prevent duplicate timetables
            const exists = await tx.timetable.findFirst({
                where: {
                    day: dto.day,
                    classId: dto.classId,
                    timeSlotId: dto.timeSlotId,
                    academicYear: dto.academicYear,
                    tenantId, // Enforce tenant
                },
            });
            if (exists) {
                throw new common_1.BadRequestException(`Timetable already exists for class ${dto.classId} on ${dto.day} at slot ${dto.timeSlotId}.`);
            }
            // ✅ 2. Auto-assign teacher if not provided
            let assignedTeacherId = dto.employerId || null;
            if (!assignedTeacherId) {
                const teacherSubject = await tx.teacherSubject.findFirst({
                    where: {
                        subjectId: dto.subjectId,
                        isCurrent: true,
                        tenantId, // Enforce tenant
                    },
                    select: { employerId: true },
                });
                if (teacherSubject) {
                    assignedTeacherId = teacherSubject.employerId;
                }
                // If no teacher found, assignedTeacherId remains null, which is valid
            }
            // ✅ 3. Create timetable
            const result = await tx.timetable.create({
                data: {
                    ...dto,
                    employerId: assignedTeacherId,
                    tenantId, // Enforce tenant
                },
                include: {
                    teacher: true,
                    subject: true,
                    Class: true,
                    timeSlot: true,
                },
            });
            this.socketGateway.emitRefresh();
            return result;
        });
    }
    async getAll(tenantId) {
        return this.prisma.timetable.findMany({
            where: { tenantId }, // Enforce tenant
            include: {
                timeSlot: true,
                subject: true,
                Class: true,
                teacher: true,
            },
            orderBy: { id: "asc" },
        });
    }
    async getByClass(tenantId, classId) {
        return this.prisma.timetable.findMany({
            where: { classId, tenantId }, // Enforce tenant
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { day: "asc" },
        });
    }
    async getByTeacher(tenantId, employerId) {
        return this.prisma.timetable.findMany({
            where: { employerId, tenantId }, // Enforce tenant
            include: {
                Class: true,
                subject: true,
                timeSlot: true,
            },
        });
    }
    async getByStudent(tenantId, studentId) {
        // Find the current class of the student
        const currentClass = await this.prisma.studentClass.findFirst({
            where: { studentId, isCurrent: true, tenantId }, // Enforce tenant
            select: { classId: true },
        });
        if (!currentClass) {
            throw new common_1.NotFoundException("No current class found for this student.");
        }
        // Fetch timetable by classId
        return this.prisma.timetable.findMany({
            where: { classId: currentClass.classId, tenantId }, // Enforce tenant
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { day: "asc" },
        });
    }
    async findByUniqueFields(tenantId, day, classId, timeSlotId, academicYear) {
        return this.prisma.timetable.findFirst({
            where: {
                day,
                classId,
                timeSlotId,
                academicYear,
                tenantId, // Enforce tenant
            },
            include: {
                subject: true,
                teacher: true,
                timeSlot: true,
                Class: true,
            },
        });
    }
    async checkDuplicate(tenantId, day, classId, timeSlotId, academicYear) {
        return this.prisma.timetable.findMany({
            where: {
                day,
                classId,
                timeSlotId,
                academicYear,
                tenantId, // Enforce tenant
            },
            include: {
                subject: true,
                teacher: true,
                timeSlot: true,
                Class: true,
            },
        });
    }
    async update(tenantId, id, dto) {
        const existing = await this.prisma.timetable.findFirst({
            where: { id, tenantId }
        });
        if (!existing)
            throw new common_1.NotFoundException("Timetable not found");
        const result = await this.prisma.timetable.update({
            where: { id },
            data: dto,
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
                Class: true,
            },
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    async remove(tenantId, id) {
        const existing = await this.prisma.timetable.findFirst({
            where: { id, tenantId }
        });
        if (!existing)
            throw new common_1.NotFoundException("Timetable not found");
        const result = await this.prisma.timetable.delete({ where: { id } });
        this.socketGateway.emitRefresh();
        return result;
    }
};
exports.TimetableService = TimetableService;
exports.TimetableService = TimetableService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, socket_gateway_1.SocketGateway])
], TimetableService);
