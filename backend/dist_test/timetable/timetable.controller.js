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
exports.TimetableController = void 0;
const common_1 = require("@nestjs/common");
const create_timetable_dto_1 = require("./dto/create-timetable.dto");
const timetable_service_1 = require("./timetable.service");
const update_timetable_dto_1 = require("./dto/update-timetable.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const common_2 = require("@nestjs/common");
const tenant_id_decorator_1 = require("../auth/decorators/tenant-id.decorator");
let TimetableController = class TimetableController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(tenantId, dto) {
        return this.service.create(tenantId, dto);
    }
    getAll(tenantId) {
        return this.service.getAll(tenantId);
    }
    getByClass(tenantId, id) {
        return this.service.getByClass(tenantId, +id);
    }
    getByTeacher(tenantId, id) {
        return this.service.getByTeacher(tenantId, +id);
    }
    getByStudent(tenantId, id) {
        return this.service.getByStudent(tenantId, +id);
    }
    async checkDuplicate(tenantId, day, classId, timeSlotId, academicYear) {
        return this.service.checkDuplicate(tenantId, day, classId, timeSlotId, academicYear);
    }
    update(tenantId, id, dto) {
        return this.service.update(tenantId, +id, dto);
    }
    remove(tenantId, id) {
        return this.service.remove(tenantId, +id);
    }
};
exports.TimetableController = TimetableController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_timetable_dto_1.CreateTimetableDto]),
    __metadata("design:returntype", Promise)
], TimetableController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('class/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getByClass", null);
__decorate([
    (0, common_1.Get)('teacher/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getByTeacher", null);
__decorate([
    (0, common_1.Get)('student/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "getByStudent", null);
__decorate([
    (0, common_1.Get)('check'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('day')),
    __param(2, (0, common_1.Query)('classId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('timeSlotId', common_1.ParseIntPipe)),
    __param(4, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], TimetableController.prototype, "checkDuplicate", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, update_timetable_dto_1.UpdateTimetableDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "remove", null);
exports.TimetableController = TimetableController = __decorate([
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('timetable'),
    __metadata("design:paramtypes", [timetable_service_1.TimetableService])
], TimetableController);
