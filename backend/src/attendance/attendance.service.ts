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
    async saves(dto: SaveStudentAttendanceDto) {
        const result = await this.repo.save(dto);
        this.socketGateway.emitRefresh();
        return result;
    }


    async updateStudent(id: number, dto: UpdateStudentAttendanceDto) {
        const result = await this.repo.updateStudent(id, dto);
        this.socketGateway.emitRefresh();
        return result;
    }

    async deleteStudent(id: number) {
        const result = await this.repo.deleteStudent(id);
        this.socketGateway.emitRefresh();
        return result;
    }

    getAllStudents() {
        return this.repo.getAllStudents();
    }

    getAllClasses() {
        return this.repo.getAllClasses();
    }
    // ✅ Get students by classId (via Local)
    async getStudentsByClassId(classId: number) {
        return this.repo.getStudentsByClassId(classId);
    }

    // Get existing attendance by date and classId
    async getExistingAttendance(classId: number, date: string) {
        return this.repo.getExistingAttendance(classId, date);
    }

    // 👩‍🏫 Employer
    async createEmployer(dto: CreateEmployerAttendanceDto) {
        let { status, checkInTime, employerId } = dto;

        // Fetch employer config for this specific pointage
        const employer = await this.repo.getEmployerConfig(employerId) as any;
        
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

        const result = await this.repo.createEmployer({ ...dto, status });
        this.socketGateway.emitRefresh();
        return result;
    }

    async updateEmployer(id: number, dto: UpdateEmployerAttendanceDto) {
        let { status, checkInTime, employerId } = dto;

        if (checkInTime && (!status || status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE)) {
            // We need employerId to get config. If not in DTO, we might need to fetch existing record first.
            let eid = employerId;
            if (!eid) {
                const existing = await this.repo.getEmployerAttendanceById(id);
                eid = existing?.employerId;
            }

            if (eid) {
                const employer = await this.repo.getEmployerConfig(eid) as any;
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

        const result = await this.repo.updateEmployer(id, { ...dto, status });
        this.socketGateway.emitRefresh();
        return result;
    }

    getAllEmployers() {
        return this.repo.getAllEmployers();
    }

    getAllEmployerBasics() {
        return this.repo.getAllEmployerBasics();
    }

    getExistingEmployerAttendance(date: string) {
        return this.repo.getExistingEmployerAttendance(date);
    }

    async deleteEmployerAttendance(id: number) {
        const result = await this.repo.deleteEmployerAttendance(id);
        this.socketGateway.emitRefresh();
        return result;
    }

    getStudentLast7DaysAttendance(classId: number) {
        return this.repo.getStudentLast7DaysAttendance(classId);
    }

    getEmployerLast7DaysAttendance() {
        return this.repo.getEmployerLast7DaysAttendance();
    }
    getStudentWeeklyChartData(classId: number) {
        return this.repo.getStudentWeeklyChartData(classId);
    }

    getStudentDailySummaryData(classId: number, date: string) {
        return this.repo.getStudentDailySummaryData(classId, date);
    }

    async getGlobalWeeklyChartData() {
        return this.repo.getGlobalWeeklyChartData();
    }

    async getGlobalDailySummaryData(date: string) {
        return this.repo.getGlobalDailySummaryData(date);
    }

    getStudentAttendance(studentId: number) {
        return this.repo.getStudentAttendance(studentId);
    }

    getEmployerWeeklyChartData() {
        return this.repo.getEmployerWeeklyChartData();
    }

    async getEmployerDailySummaryData(date: string) {
        return this.repo.getEmployerDailySummaryData(date);
    }

    async getEmployerStats(employerId: number) {
        const attendance = await this.repo.getEmployerAttendanceByEmployerId(employerId);
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
