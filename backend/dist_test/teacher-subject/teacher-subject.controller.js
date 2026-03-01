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
exports.TeacherSubjectController = void 0;
const common_1 = require("@nestjs/common");
const teacher_subject_service_1 = require("./teacher-subject.service");
const CreateTeacherSubject_Dto_1 = require("./dto/CreateTeacherSubject.Dto");
const tenant_id_decorator_1 = require("../auth/decorators/tenant-id.decorator");
let TeacherSubjectController = class TeacherSubjectController {
    teacherSubjectService;
    constructor(teacherSubjectService) {
        this.teacherSubjectService = teacherSubjectService;
    }
    async bulkInsert(tenantId, dto) {
        return this.teacherSubjectService.bulkInsert(tenantId, dto);
    }
    async getSubjectsByTeacher(tenantId, employerId) {
        return this.teacherSubjectService.getSubjectsByTeacher(tenantId, employerId);
    }
    getTeacherBySubject(tenantId, subjectId, academicYear) {
        return this.teacherSubjectService.getTeacherBySubject(tenantId, +subjectId, academicYear);
    }
    removeSubjectFromTeacher(tenantId, employerId, subjectId) {
        return this.teacherSubjectService.removeSubjectFromTeacher(tenantId, employerId, subjectId);
    }
};
exports.TeacherSubjectController = TeacherSubjectController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateTeacherSubject_Dto_1.CreateteacherSubjectDto]),
    __metadata("design:returntype", Promise)
], TeacherSubjectController.prototype, "bulkInsert", null);
__decorate([
    (0, common_1.Get)(':employerId'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('employerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TeacherSubjectController.prototype, "getSubjectsByTeacher", null);
__decorate([
    (0, common_1.Get)('subject/:subjectId'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('subjectId')),
    __param(2, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TeacherSubjectController.prototype, "getTeacherBySubject", null);
__decorate([
    (0, common_1.Delete)(':employerId/:subjectId'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('employerId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('subjectId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], TeacherSubjectController.prototype, "removeSubjectFromTeacher", null);
exports.TeacherSubjectController = TeacherSubjectController = __decorate([
    (0, common_1.Controller)('teacher-subject'),
    __metadata("design:paramtypes", [teacher_subject_service_1.TeacherSubjectService])
], TeacherSubjectController);
