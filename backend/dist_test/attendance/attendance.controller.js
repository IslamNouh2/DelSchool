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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const update_attendance_dto_1 = require("./dto/update-attendance.dto");
const create_employer_attendance_dto_1 = require("./dto/create-employer-attendance.dto");
const update_employer_attendance_dto_1 = require("./dto/update-employer-attendance.dto");
let AttendanceController = class AttendanceController {
    service;
    constructor(service) {
        this.service = service;
    }
    // 🧒 Student
    async saveStudentAttendance(req, body) {
        console.log("🧾 Received attendance payload:", JSON.stringify(body, null, 2));
        return this.service.saves(req.tenantId, body);
    }
    updateStudent(req, id, dto) {
        return this.service.updateStudent(req.tenantId, Number(id), dto);
    }
    deleteStudent(req, id) {
        return this.service.deleteStudent(req.tenantId, Number(id));
    }
    getStudents(req) {
        return this.service.getAllStudents(req.tenantId);
    }
    async getStudentsByClass(req, classId) {
        return this.service.getStudentsByClassId(req.tenantId, classId);
    }
    async findAll(req) {
        return this.service.getAllClasses(req.tenantId);
    }
    async getExistingAttendance(req, classId, date) {
        return this.service.getExistingAttendance(req.tenantId, classId, date);
    }
    // 👩‍🏫 Employer
    createEmployer(req, dto) {
        return this.service.createEmployer(req.tenantId, dto);
    }
    updateEmployer(req, id, dto) {
        return this.service.updateEmployer(req.tenantId, Number(id), dto);
    }
    getEmployers(req) {
        return this.service.getAllEmployers(req.tenantId);
    }
    // Employers basic list for taking attendance
    getEmployersBasic(req) {
        return this.service.getAllEmployerBasics(req.tenantId);
    }
    // Existing employer attendance by date (?date=YYYY-MM-DD)
    getExistingEmployer(req, date) {
        return this.service.getExistingEmployerAttendance(req.tenantId, date);
    }
    deleteEmployerAttendance(req, id) {
        return this.service.deleteEmployerAttendance(req.tenantId, Number(id));
    }
    getStudentLast7Days(req, classId) {
        return this.service.getStudentLast7DaysAttendance(req.tenantId, classId);
    }
    getEmployerLast7Days(req) {
        return this.service.getEmployerLast7DaysAttendance(req.tenantId);
    }
    getStudentWeeklyChart(req, classId) {
        return this.service.getStudentWeeklyChartData(req.tenantId, classId);
    }
    getStudentDailySummary(req, classId, date) {
        return this.service.getStudentDailySummaryData(req.tenantId, classId, date);
    }
    getStudentAttendance(req, id) {
        return this.service.getStudentAttendance(req.tenantId, id);
    }
    getGlobalWeeklyChart(req) {
        return this.service.getGlobalWeeklyChartData(req.tenantId);
    }
    getGlobalDailySummary(req, date) {
        return this.service.getGlobalDailySummaryData(req.tenantId, date);
    }
    getEmployerWeeklyChart(req) {
        return this.service.getEmployerWeeklyChartData(req.tenantId);
    }
    getEmployerDailySummary(req, date) {
        return this.service.getEmployerDailySummaryData(req.tenantId, date);
    }
    async getEmployerStats(req, id) {
        return this.service.getEmployerStats(req.tenantId, id);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "saveStudentAttendance", null);
__decorate([
    (0, common_1.Patch)('student/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_attendance_dto_1.UpdateStudentAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)('student/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "deleteStudent", null);
__decorate([
    (0, common_1.Get)('student'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Get)('students/:classId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('classId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentsByClass", null);
__decorate([
    (0, common_1.Get)('class'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('existing/:classId/:date'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('classId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getExistingAttendance", null);
__decorate([
    (0, common_1.Post)('employer'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_employer_attendance_dto_1.CreateEmployerAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "createEmployer", null);
__decorate([
    (0, common_1.Patch)('employer/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_employer_attendance_dto_1.UpdateEmployerAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "updateEmployer", null);
__decorate([
    (0, common_1.Get)('employer'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getEmployers", null);
__decorate([
    (0, common_1.Get)('employers'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getEmployersBasic", null);
__decorate([
    (0, common_1.Get)('employer-existing'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getExistingEmployer", null);
__decorate([
    (0, common_1.Delete)('employer/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "deleteEmployerAttendance", null);
__decorate([
    (0, common_1.Get)('student-last7days/:classId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('classId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudentLast7Days", null);
__decorate([
    (0, common_1.Get)('employer-last7days'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getEmployerLast7Days", null);
__decorate([
    (0, common_1.Get)('student-weekly-chart/:classId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('classId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudentWeeklyChart", null);
__decorate([
    (0, common_1.Get)('student-daily-summary/:classId/:date'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('classId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudentDailySummary", null);
__decorate([
    (0, common_1.Get)('student/:id/history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getStudentAttendance", null);
__decorate([
    (0, common_1.Get)('global-weekly-chart'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getGlobalWeeklyChart", null);
__decorate([
    (0, common_1.Get)('global-daily-summary/:date'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getGlobalDailySummary", null);
__decorate([
    (0, common_1.Get)('employer-weekly-chart'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getEmployerWeeklyChart", null);
__decorate([
    (0, common_1.Get)('employer-daily-summary/:date'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getEmployerDailySummary", null);
__decorate([
    (0, common_1.Get)('employer/:id/stats'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getEmployerStats", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
