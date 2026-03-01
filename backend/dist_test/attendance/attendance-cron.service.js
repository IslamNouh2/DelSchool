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
var AttendanceCronService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("prisma/prisma.service");
const client_1 = require("@prisma/client");
let AttendanceCronService = AttendanceCronService_1 = class AttendanceCronService {
    prisma;
    logger = new common_1.Logger(AttendanceCronService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Automatically creates ABSENT records for employees who haven't checked in by the end of the day.
     * Runs every day at 20:00 (8 PM).
     */
    async autoMarkAbsent() {
        this.logger.log('Starting Auto-Absence Cron job...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 1. Get all active employers
        const employers = await this.prisma.employer.findMany({
            where: { okBlock: false },
        });
        // 2. Identify who is missing attendance for today
        for (const emp of employers) {
            const attendance = await this.prisma.employerAttendance.findUnique({
                where: {
                    employerId_date_academicYear: {
                        employerId: emp.employerId,
                        date: today,
                        academicYear: '2024-2025', // Should ideally come from a settings/parameter service
                    },
                },
            });
            if (!attendance) {
                // 3. Create ABSENT record
                await this.prisma.employerAttendance.create({
                    data: {
                        employerId: emp.employerId,
                        date: today,
                        status: client_1.AttendanceStatus.ABSENT,
                        academicYear: '2024-2025',
                        remarks: 'Auto-marked absent by system cron',
                        tenantId: emp.tenantId, // Scoped from employer
                    },
                });
                this.logger.log(`Marked Employer ${emp.employerId} as ABSENT for ${today.toDateString()}`);
            }
        }
        this.logger.log('Auto-Absence Cron job completed.');
    }
};
exports.AttendanceCronService = AttendanceCronService;
__decorate([
    (0, schedule_1.Cron)('0 20 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "autoMarkAbsent", null);
exports.AttendanceCronService = AttendanceCronService = AttendanceCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], AttendanceCronService);
