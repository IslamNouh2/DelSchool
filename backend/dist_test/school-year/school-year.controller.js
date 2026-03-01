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
exports.SchoolYearController = void 0;
const common_1 = require("@nestjs/common");
const school_year_service_1 = require("./school-year.service");
const tenant_id_decorator_1 = require("../auth/decorators/tenant-id.decorator");
let SchoolYearController = class SchoolYearController {
    schoolYearService;
    constructor(schoolYearService) {
        this.schoolYearService = schoolYearService;
    }
    create(tenantId, createDto) {
        return this.schoolYearService.create(tenantId, {
            ...createDto,
            startDate: new Date(createDto.startDate),
            endDate: new Date(createDto.endDate),
        });
    }
    findAll(tenantId) {
        return this.schoolYearService.findAll(tenantId);
    }
    getCurrent(tenantId) {
        return this.schoolYearService.getCurrentYear(tenantId);
    }
    update(tenantId, id, updateDto) {
        return this.schoolYearService.update(tenantId, +id, {
            ...updateDto,
            startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
            endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
        });
    }
    remove(tenantId, id) {
        return this.schoolYearService.remove(tenantId, +id);
    }
};
exports.SchoolYearController = SchoolYearController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolYearController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolYearController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('current'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolYearController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SchoolYearController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SchoolYearController.prototype, "remove", null);
exports.SchoolYearController = SchoolYearController = __decorate([
    (0, common_1.Controller)('school-year'),
    __metadata("design:paramtypes", [school_year_service_1.SchoolYearService])
], SchoolYearController);
