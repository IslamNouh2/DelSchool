import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { SaveStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';
import { UpdateEmployerAttendanceDto } from './dto/update-employer-attendance.dto';
import { AttendanceStatus } from '@prisma/client';
import { SocketGateway } from '../socket/socket.gateway';

import { ParameterService } from '../parameter/parameter.service';

@Injectable()
export class AttendanceService {
    constructor(
        private readonly repo: AttendanceRepository,
        private readonly socketGateway: SocketGateway,
        private readonly parameterService: ParameterService
    ) { }

    // 🧒 Student
    async saves(tenantId: string, dto: SaveStudentAttendanceDto) {
        const result = await this.repo.save(tenantId, dto);
        this.socketGateway.emitRefresh();
        return result;
    }


    async updateStudent(tenantId: string, id: number, dto: UpdateStudentAttendanceDto) {
        const result = await this.repo.updateStudent(tenantId, id, dto);
        this.socketGateway.emitRefresh();
        return result;
    }

    async deleteStudent(tenantId: string, id: number) {
        const result = await this.repo.deleteStudent(tenantId, id);
        this.socketGateway.emitRefresh();
        return result;
    }

    getAllStudents(tenantId: string) {
        return this.repo.getAllStudents(tenantId);
    }

    getAllClasses(tenantId: string) {
        return this.repo.getAllClasses(tenantId);
    }
    // ✅ Get students by classId (via Local)
    async getStudentsByClassId(tenantId: string, classId: number) {
        return this.repo.getStudentsByClassId(tenantId, classId);
    }

    // Get existing attendance by date and classId
    async getExistingAttendance(tenantId: string, classId: number, date: string) {
        return this.repo.getExistingAttendance(tenantId, classId, date);
    }

    // 👩‍🏫 Employer
    async createEmployer(tenantId: string, dto: CreateEmployerAttendanceDto) {
        let { status, checkInTime, employerId } = dto;

        // Fetch employer config for this specific pointage
        const employer = await this.repo.getEmployerConfig(tenantId, employerId) as any;
        
        // Auto-determine status if not explicitly set to something else (like EXCUSED)
        if (checkInTime && (!status || status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE)) {
            const checkIn = new Date(checkInTime);
            const hours = checkIn.getHours();
            const minutes = checkIn.getMinutes();

            // Use employer's specific shift time, or fallback to global threshold
            let thresholdHours = 8;
            let thresholdMinutes = 10;

            if (employer?.checkInTime) {
                const [h, m] = employer.checkInTime.split(':').map(Number);
                thresholdHours = h;
                thresholdMinutes = m;
            } else {
                const globalThreshold = await this.parameterService.getLateThreshold();
                thresholdHours = globalThreshold.hours;
                thresholdMinutes = globalThreshold.minutes;
            }

            if (hours > thresholdHours || (hours === thresholdHours && minutes > thresholdMinutes)) {
                status = AttendanceStatus.LATE;
            } else {
                status = AttendanceStatus.PRESENT;
            }
        } else if (!checkInTime && !status) {
            status = AttendanceStatus.ABSENT;
        }

        const result = await this.repo.createEmployer(tenantId, { ...dto, status });
        this.socketGateway.emitRefresh();
        return result;
    }

    async updateEmployer(tenantId: string, id: number, dto: UpdateEmployerAttendanceDto) {
        let { status, checkInTime, employerId } = dto;

        if (checkInTime && (!status || status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE)) {
            // We need employerId to get config. If not in DTO, we might need to fetch existing record first.
            let eid = employerId;
            if (!eid) {
                const existing = await this.repo.getEmployerAttendanceById(tenantId, id);
                eid = existing?.employerId;
            }

            if (eid) {
                const employer = await this.repo.getEmployerConfig(tenantId, eid) as any;
                const checkIn = new Date(checkInTime as any);
                const hours = checkIn.getHours();
                const minutes = checkIn.getMinutes();

                let thresholdHours = 8;
                let thresholdMinutes = 10;

                if (employer?.checkInTime) {
                    const [h, m] = employer.checkInTime.split(':').map(Number);
                    thresholdHours = h;
                    thresholdMinutes = m;
                } else {
                    const globalThreshold = await this.parameterService.getLateThreshold();
                    thresholdHours = globalThreshold.hours;
                    thresholdMinutes = globalThreshold.minutes;
                }

                if (hours > thresholdHours || (hours === thresholdHours && minutes > thresholdMinutes)) {
                    status = AttendanceStatus.LATE;
                } else {
                    status = AttendanceStatus.PRESENT;
                }
            }
        }

        const result = await this.repo.updateEmployer(tenantId, id, { ...dto, status });
        this.socketGateway.emitRefresh();
        return result;
    }

    getAllEmployers(tenantId: string) {
        return this.repo.getAllEmployers(tenantId);
    }

    getAllEmployerBasics(tenantId: string) {
        return this.repo.getAllEmployerBasics(tenantId);
    }

    getExistingEmployerAttendance(tenantId: string, date: string) {
        return this.repo.getExistingEmployerAttendance(tenantId, date);
    }

    async deleteEmployerAttendance(tenantId: string, id: number) {
        const result = await this.repo.deleteEmployerAttendance(tenantId, id);
        this.socketGateway.emitRefresh();
        return result;
    }

    getStudentLast7DaysAttendance(tenantId: string, classId: number) {
        return this.repo.getStudentLast7DaysAttendance(tenantId, classId);
    }

    getEmployerLast7DaysAttendance(tenantId: string) {
        return this.repo.getEmployerLast7DaysAttendance(tenantId);
    }
    getStudentWeeklyChartData(tenantId: string, classId: number) {
        return this.repo.getStudentWeeklyChartData(tenantId, classId);
    }

    getStudentDailySummaryData(tenantId: string, classId: number, date: string) {
        return this.repo.getStudentDailySummaryData(tenantId, classId, date);
    }

    async getGlobalWeeklyChartData(tenantId: string) {
        return this.repo.getGlobalWeeklyChartData(tenantId);
    }

    async getGlobalDailySummaryData(tenantId: string, date: string) {
        return this.repo.getGlobalDailySummaryData(tenantId, date);
    }

    getStudentAttendance(tenantId: string, studentId: number) {
        return this.repo.getStudentAttendance(tenantId, studentId);
    }

    getEmployerWeeklyChartData(tenantId: string) {
        return this.repo.getEmployerWeeklyChartData(tenantId);
    }

    async getEmployerDailySummaryData(tenantId: string, date: string) {
        return this.repo.getEmployerDailySummaryData(tenantId, date);
    }

    async getEmployerStats(tenantId: string, employerId: number) {
        const attendance = await this.repo.getEmployerAttendanceByEmployerId(tenantId, employerId);
        const totalDays = attendance.length;
        if (totalDays === 0) {
            return {
                totalDays: 0,
                absentDays: 0,
                lateDays: 0,
                presentDays: 0,
                attendanceRate: 100,
            };
        }

        const absentDays = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
        const lateDays = attendance.filter(a => a.status === AttendanceStatus.LATE).length;
        const presentDays = totalDays - absentDays;
        const attendanceRate = ((presentDays / totalDays) * 100).toFixed(1);

        return {
            totalDays,
            absentDays,
            lateDays,
            presentDays,
            attendanceRate: parseFloat(attendanceRate),
            records: attendance,
        };
    }
}
