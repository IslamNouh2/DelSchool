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
exports.CompteController = void 0;
const common_1 = require("@nestjs/common");
const compte_service_1 = require("./compte.service");
const create_compte_dto_1 = require("./dto/create-compte.dto");
const update_compte_dto_1 = require("./dto/update-compte.dto");
const jwt_auth_guard_1 = require("src/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("src/auth/guards/roles.guard");
let CompteController = class CompteController {
    compteService;
    constructor(compteService) {
        this.compteService = compteService;
    }
    create(req, createCompteDto) {
        return this.compteService.create(req.tenantId, createCompteDto);
    }
    findAll(req, page, limit, search, status) {
        return this.compteService.findAll(req.tenantId, page ? +page : 1, limit ? +limit : 10, search, status);
    }
    findOne(req, id) {
        return this.compteService.findOne(req.tenantId, +id);
    }
    getTransactions(req, id, startDate, endDate, page = '1', limit = '20', search) {
        return this.compteService.getTransactions(req.tenantId, +id, startDate, endDate, +page, +limit, search);
    }
    createTransaction(req, id, dto) {
        return this.compteService.createTransaction(req.tenantId, +id, dto, req.user?.id);
    }
    updateTransaction(req, entryId, dto) {
        return this.compteService.updateTransaction(req.tenantId, +entryId, dto, req.user?.id);
    }
    deleteTransaction(req, entryId) {
        return this.compteService.deleteTransaction(req.tenantId, +entryId);
    }
    update(req, id, updateCompteDto) {
        return this.compteService.update(req.tenantId, +id, updateCompteDto);
    }
    remove(req, id) {
        return this.compteService.remove(req.tenantId, +id);
    }
};
exports.CompteController = CompteController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_compte_dto_1.CreateCompteDto]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/transactions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)(':id/transaction'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Post)('transaction/:entryId') // Using Post/Put? Let's use Put for update
    // But wait, the route was /compte/transaction/:entryId
    // NestJS controller prefix is 'compte'
    ,
    (0, common_1.Patch)('transaction/:entryId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('entryId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "updateTransaction", null);
__decorate([
    (0, common_1.Delete)('transaction/:entryId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_compte_dto_1.UpdateCompteDto]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CompteController.prototype, "remove", null);
exports.CompteController = CompteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('compte'),
    __metadata("design:paramtypes", [compte_service_1.CompteService])
], CompteController);
