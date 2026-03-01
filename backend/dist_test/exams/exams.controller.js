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
exports.ExamController = void 0;
const common_1 = require("@nestjs/common");
const exams_service_1 = require("./exams.service");
const create_exam_dto_1 = require("./DTO/create-exam.dto");
const update_exam_dto_1 = require("./DTO/update-exam.dto");
const upsert_grades_dto_1 = require("./DTO/upsert-grades.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const common_2 = require("@nestjs/common");
const tenant_id_decorator_1 = require("../auth/decorators/tenant-id.decorator");
let ExamController = class ExamController {
    examService;
    constructor(examService) {
        this.examService = examService;
    }
    create(tenantId, createExamDto) {
        return this.examService.create(tenantId, createExamDto);
    }
    findAll(tenantId, page = 1, limit = 10, search) {
        return this.examService.findAll(tenantId, page, limit, search);
    }
    getExams(tenantId) {
        return this.examService.getExams(tenantId);
    }
    async getSubjectOfClass(tenantId, classId, examId) {
        return this.examService.getSubjectOfClass(tenantId, classId, examId);
    }
    async saveGrades(tenantId, dto) {
        return this.examService.saveGrades(tenantId, dto);
    }
    findOne(tenantId, id) {
        return this.examService.findOne(tenantId, id);
    }
    async getStudentGrades(tenantId, studentId) {
        return this.examService.getStudentGrades(tenantId, studentId);
    }
    update(tenantId, id, updateExamDto) {
        return this.examService.update(tenantId, id, updateExamDto);
    }
    togglePublish(tenantId, id, publish) {
        return this.examService.togglePublish(tenantId, id, publish);
    }
    async getDashboardStats(tenantId) {
        return this.examService.getDashboardStats(tenantId);
    }
    async getSubjectPerformance(tenantId) {
        return this.examService.getSubjectPerformance(tenantId);
    }
    async getGradeDistribution(tenantId) {
        return this.examService.getGradeDistribution(tenantId);
    }
    async getClassPerformance(tenantId) {
        return this.examService.getClassPerformance(tenantId);
    }
    remove(tenantId, id) {
        return this.examService.remove(tenantId, id);
    }
    getTopStudents(tenantId, classId) {
        return this.examService.getTopStudents(tenantId, classId ? parseInt(classId) : undefined);
    }
    getUpcomingExams(tenantId, classId) {
        return this.examService.getUpcomingExams(tenantId, classId ? parseInt(classId) : undefined);
    }
};
exports.ExamController = ExamController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_exam_dto_1.CreateExamDto]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('page', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('exams'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "getExams", null);
__decorate([
    (0, common_1.Get)('subjects/:classId/:examId'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('classId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('examId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getSubjectOfClass", null);
__decorate([
    (0, common_1.Post)('grades'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_grades_dto_1.UpsertGradesDto]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "saveGrades", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('studentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getStudentGrades", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, update_exam_dto_1.UpdateExamDto]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('publish')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Boolean]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "togglePublish", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('dashboard/subject-performance'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getSubjectPerformance", null);
__decorate([
    (0, common_1.Get)('dashboard/distribution'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getGradeDistribution", null);
__decorate([
    (0, common_1.Get)('dashboard/class-performance'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getClassPerformance", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('dashboard/top-students'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "getTopStudents", null);
__decorate([
    (0, common_1.Get)('dashboard/upcoming'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('classId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamController.prototype, "getUpcomingExams", null);
exports.ExamController = ExamController = __decorate([
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('exam'),
    __metadata("design:paramtypes", [exams_service_1.ExamService])
], ExamController);
