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
exports.TeacherSubjectService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("../socket/socket.gateway");
let TeacherSubjectService = class TeacherSubjectService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    async bulkInsert(tenantId, dto) {
        const { employerId, subjectIds } = dto;
        // 1) Prepare the records
        const records = subjectIds.map((subjectId) => ({
            employerId,
            subjectId,
            isCurrent: false,
            tenantId,
        }));
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // 2) Validate employer is a teacher
                const employer = await tx.employer.findUnique({
                    where: { employerId: employerId, tenantId },
                    select: { type: true }, // or whatever field denotes the role/type
                });
                if (!employer) {
                    throw new common_1.BadRequestException(`Employer with id ${employerId} does not exist.`);
                }
                if (employer.type !== 'teacher') {
                    throw new common_1.BadRequestException(`Employer id ${employerId} is not a teacher.`);
                }
                // 3) Do your bulk insert
                const insertResult = await tx.teacherSubject.createMany({
                    data: records,
                    skipDuplicates: true,
                });
                return insertResult;
            });
            this.socketGateway.emitRefresh();
            return {
                message: 'Subjects assigned successfully.',
                count: result.count,
            };
        }
        catch (error) {
            // Prisma will auto-rollback on any thrown error in the tx callback
            console.error('Transaction failed, rolled back:', error);
            throw error;
        }
    }
    async getSubjectsByTeacher(tenantId, employerId) {
        return this.prisma.teacherSubject.findMany({
            where: { employerId: Number(employerId), tenantId },
            include: {
                subject: true,
            },
        });
    }
    // teacher-subject.service.ts
    async getTeacherBySubject(tenantId, subjectId, academicYear) {
        const teachersInSubject = await this.prisma.teacherSubject.findMany({
            where: { subjectId: Number(subjectId), tenantId },
            include: { Employer: true },
        });
        if (!academicYear) {
            return teachersInSubject;
        }
        // Filter teachers based on workload
        const activeTeachers = await Promise.all(teachersInSubject.map(async (ts) => {
            const employer = ts.Employer;
            if (!employer)
                return null;
            // Count timetable entries for this teacher in this academic year
            const count = await this.prisma.timetable.count({
                where: {
                    employerId: employer.employerId,
                    academicYear: academicYear,
                    tenantId,
                },
            });
            // If workload is 0 or null, treat as 20 by default (matching schema)
            const maxWorkload = employer.weeklyWorkload || 20;
            return {
                ...ts,
                isFull: count >= maxWorkload,
                currentWorkload: count,
                maxWorkload: maxWorkload,
            };
        }));
        // Filter out nulls and ideally only return teachers that are NOT full
        // or return all with the flag so the frontend can show a warning
        return activeTeachers.filter(Boolean);
    }
    async removeSubjectFromTeacher(tenantId, employerId, subjectId) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const record = await tx.teacherSubject.findFirst({
                    where: {
                        employerId,
                        subjectId,
                        tenantId,
                    },
                });
                if (!record) {
                    throw new common_1.NotFoundException('Subject not assigned to this Teacher.');
                }
                await tx.teacherSubject.delete({
                    where: {
                        id: record.id,
                    },
                });
                return { message: 'Subject removed from Teacher successfully.' };
            });
            this.socketGateway.emitRefresh();
            return result;
        }
        catch (error) {
            // Optionally handle error logging or rethrow
            console.error('Transaction failed and rolled back:', error);
            throw error;
        }
    }
};
exports.TeacherSubjectService = TeacherSubjectService;
exports.TeacherSubjectService = TeacherSubjectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, socket_gateway_1.SocketGateway])
], TeacherSubjectService);
