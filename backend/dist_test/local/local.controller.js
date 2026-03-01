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
exports.LocalController = void 0;
const common_1 = require("@nestjs/common");
const local_service_1 = require("./local.service");
const CreateLocal_dto_1 = require("./DTO/CreateLocal.dto");
const roles_guard_1 = require("src/auth/guards/roles.guard");
const roles_decorator_1 = require("src/auth/decorators/roles.decorator");
const register_dto_1 = require("src/auth/dto/register.dto");
const jwt_auth_guard_1 = require("src/auth/guards/jwt-auth.guard");
const tenant_id_decorator_1 = require("src/auth/decorators/tenant-id.decorator");
let LocalController = class LocalController {
    localService;
    constructor(localService) {
        this.localService = localService;
    }
    async getLocals(tenantId, page = '1', limit = '10', sort, search) {
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const validSortFields = ['dateCreate', 'code', 'name', 'NumClass'];
        const orderByField = validSortFields.includes(sort) ? sort : 'name';
        return this.localService.GetLocal(tenantId, pageNumber, limitNumber, orderByField, search);
    }
    async CreateLocal(tenantId, dto) {
        const Local = await this.localService.CreateLocal(tenantId, dto);
        return Local;
    }
    async DeleteLocal(tenantId, id) {
        const Delete = await this.localService.DeleteLocal(tenantId, id);
        return { message: 'Local deleted successfully' };
    }
    async UpdateLocals(tenantId, id, dto) {
        const Local = await this.localService.UpdateLocal(tenantId, id, dto);
        return Local;
    }
    getSubjectCount(tenantId) {
        return this.localService.CountLocals(tenantId);
    }
};
exports.LocalController = LocalController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], LocalController.prototype, "getLocals", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateLocal_dto_1.CreateLocalDto]),
    __metadata("design:returntype", Promise)
], LocalController.prototype, "CreateLocal", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], LocalController.prototype, "DeleteLocal", null);
__decorate([
    (0, common_1.Put)('/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, CreateLocal_dto_1.CreateLocalDto]),
    __metadata("design:returntype", Promise)
], LocalController.prototype, "UpdateLocals", null);
__decorate([
    (0, common_1.Get)('counter'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocalController.prototype, "getSubjectCount", null);
exports.LocalController = LocalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(register_dto_1.Role.ADMIN),
    (0, common_1.Controller)('local'),
    __metadata("design:paramtypes", [local_service_1.LocalService])
], LocalController);
