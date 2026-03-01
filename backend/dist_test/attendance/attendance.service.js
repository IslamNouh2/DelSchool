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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const attendance_repository_1 = require("./attendance.repository");
const client_1 = require("@prisma/client");
const socket_gateway_1 = require("../socket/socket.gateway");
const parameter_service_1 = require("../parameter/parameter.service");
let AttendanceService = class AttendanceService {
    repo;
    socketGateway;
    parameterService;
    constructor(repo, socketGateway, parameterService) {
        this.repo = repo;
        this.socketGateway = socketGateway;
        this.parameterService = parameterService;
    }
    // 🧒 Student
    async saves(tenantId, dto) {
        const result = await this.repo.save(tenantId, dto);
        this.socketGateway.emitRefresh();
        return result;
    }
    async updateStudent(tenantId, id, dto) {
        const result = await this.repo.updateStudent(tenantId, id, dto);
        this.socketGateway.emitRefresh();
        return result;
    }
    async deleteStudent(tenantId, id) {
        const result = await this.repo.deleteStudent(tenantId, id);
        this.socketGateway.emitRefresh();
        return result;
    }
    getAllStudents(tenantId) {
        return this.repo.getAllStudents(tenantId);
    }
    getAllClasses(tenantId) {
        return this.repo.getAllClasses(tenantId);
    }
    // ✅ Get students by classId (via Local)
    async getStudentsByClassId(tenantId, classId) {
        return this.repo.getStudentsByClassId(tenantId, classId);
    }
    // Get existing attendance by date and classId
    async getExistingAttendance(tenantId, classId, date) {
        return this.repo.getExistingAttendance(tenantId, classId, date);
    }
    // 👩‍🏫 Employer
    async createEmployer(tenantId, dto) {
        let { status, checkInTime, employerId } = dto;
        // Fetch employer config for this specific pointage
        const employer = await this.repo.getEmployerConfig(tenantId, employerId);
        // Auto-determine status if not explicitly set to something else (like EXCUSED)
        if (checkInTime && (!status || status === client_1.AttendanceStatus.PRESENT || status === client_1.AttendanceStatus.LATE)) {
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
            }
            else {
                const globalThreshold = await this.parameterService.getLateThreshold();
                thresholdHours = globalThreshold.hours;
                thresholdMinutes = globalThreshold.minutes;
            }
            if (hours > thresholdHours || (hours === thresholdHours && minutes > thresholdMinutes)) {
                status = client_1.AttendanceStatus.LATE;
            }
            else {
                status = client_1.AttendanceStatus.PRESENT;
            }
        }
        else if (!checkInTime && !status) {
            status = client_1.AttendanceStatus.ABSENT;
        }
        const result = await this.repo.createEmployer(tenantId, { ...dto, status });
        this.socketGateway.emitRefresh();
        return result;
    }
    async updateEmployer(tenantId, id, dto) {
        let { status, checkInTime, employerId } = dto;
        if (checkInTime && (!status || status === client_1.AttendanceStatus.PRESENT || status === client_1.AttendanceStatus.LATE)) {
            // We need employerId to get config. If not in DTO, we might need to fetch existing record first.
            let eid = employerId;
            if (!eid) {
                const existing = await this.repo.getEmployerAttendanceById(tenantId, id);
                eid = existing?.employerId;
            }
            if (eid) {
                const employer = await this.repo.getEmployerConfig(tenantId, eid);
                const checkIn = new Date(checkInTime);
                const hours = checkIn.getHours();
                const minutes = checkIn.getMinutes();
                let thresholdHours = 8;
                let thresholdMinutes = 10;
                if (employer?.checkInTime) {
                    const [h, m] = employer.checkInTime.split(':').map(Number);
                    thresholdHours = h;
                    thresholdMinutes = m;
                }
                else {
                    const globalThreshold = await this.parameterService.getLateThreshold();
                    thresholdHours = globalThreshold.hours;
                    thresholdMinutes = globalThreshold.minutes;
                }
                if (hours > thresholdHours || (hours === thresholdHours && minutes > thresholdMinutes)) {
                    status = client_1.AttendanceStatus.LATE;
                }
                else {
                    status = client_1.AttendanceStatus.PRESENT;
                }
            }
        }
        const result = await this.repo.updateEmployer(tenantId, id, { ...dto, status });
        this.socketGateway.emitRefresh();
        return result;
    }
    getAllEmployers(tenantId) {
        return this.repo.getAllEmployers(tenantId);
    }
    getAllEmployerBasics(tenantId) {
        return this.repo.getAllEmployerBasics(tenantId);
    }
    getExistingEmployerAttendance(tenantId, date) {
        return this.repo.getExistingEmployerAttendance(tenantId, date);
    }
    async deleteEmployerAttendance(tenantId, id) {
        const result = await this.repo.deleteEmployerAttendance(tenantId, id);
        this.socketGateway.emitRefresh();
        return result;
    }
    getStudentLast7DaysAttendance(tenantId, classId) {
        return this.repo.getStudentLast7DaysAttendance(tenantId, classId);
    }
    getEmployerLast7DaysAttendance(tenantId) {
        return this.repo.getEmployerLast7DaysAttendance(tenantId);
    }
    getStudentWeeklyChartData(tenantId, classId) {
        return this.repo.getStudentWeeklyChartData(tenantId, classId);
    }
    getStudentDailySummaryData(tenantId, classId, date) {
        return this.repo.getStudentDailySummaryData(tenantId, classId, date);
    }
    async getGlobalWeeklyChartData(tenantId) {
        return this.repo.getGlobalWeeklyChartData(tenantId);
    }
    async getGlobalDailySummaryData(tenantId, date) {
        return this.repo.getGlobalDailySummaryData(tenantId, date);
    }
    getStudentAttendance(tenantId, studentId) {
        return this.repo.getStudentAttendance(tenantId, studentId);
    }
    getEmployerWeeklyChartData(tenantId) {
        return this.repo.getEmployerWeeklyChartData(tenantId);
    }
    async getEmployerDailySummaryData(tenantId, date) {
        return this.repo.getEmployerDailySummaryData(tenantId, date);
    }
    async getEmployerStats(tenantId, employerId) {
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
        const absentDays = attendance.filter(a => a.status === client_1.AttendanceStatus.ABSENT).length;
        const lateDays = attendance.filter(a => a.status === client_1.AttendanceStatus.LATE).length;
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
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attendance_repository_1.AttendanceRepository,
        socket_gateway_1.SocketGateway,
        parameter_service_1.ParameterService])
], AttendanceService);
