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
exports.SubjectController = void 0;
// src/subjects/subjects.controller.ts
const common_1 = require("@nestjs/common");
const subject_service_1 = require("./subject.service");
const create_subject_dto_1 = require("./dto/create-subject.dto");
const update_subject_dto_1 = require("./dto/update-subject.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const roles_guard_1 = require("../auth/guards/roles.guard");
let SubjectController = class SubjectController {
    subjectsService;
    constructor(subjectsService) {
        this.subjectsService = subjectsService;
    }
    create(req, createSubjectDto) {
        return this.subjectsService.create(req.tenantId, createSubjectDto);
    }
    findSubSubjects(req) {
        return this.subjectsService.findSubSubjects(req.tenantId);
    }
    //@Roles(Role.TEACHER, Role.ADMIN)
    async findAll(req, page = 1, limit = 10, orderByField = 'dateCreate', name, status) {
        return this.subjectsService.findAll(req.tenantId, page, limit, orderByField, name, status);
    }
    count(req) {
        //console.log('Authenticated user:', req.user);
        return this.subjectsService.StubjectCount(req.tenantId);
    }
    findOne(req, id) {
        return this.subjectsService.findOne(req.tenantId, id);
    }
    update(req, id, updateSubjectDto) {
        return this.subjectsService.update(req.tenantId, id, updateSubjectDto);
    }
    remove(req, id) {
        return this.subjectsService.remove(req.tenantId, id);
    }
};
exports.SubjectController = SubjectController;
__decorate([
    (0, common_1.Post)('createSub'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_subject_dto_1.CreateSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('sub-subjects'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectController.prototype, "findSubSubjects", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('orderBy')),
    __param(4, (0, common_1.Query)('name')),
    __param(5, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], SubjectController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEACHER, client_1.Role.ADMIN),
    (0, common_1.Get)('count'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectController.prototype, "count", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEACHER, client_1.Role.ADMIN),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], SubjectController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.TEACHER, client_1.Role.ADMIN),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_subject_dto_1.UpdateSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], SubjectController.prototype, "remove", null);
exports.SubjectController = SubjectController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('subject'),
    __metadata("design:paramtypes", [subject_service_1.SubjectService])
], SubjectController);
