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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payroll_service_1 = require("./payroll.service");
const create_payroll_dto_1 = require("./dto/create-payroll.dto");
const update_payroll_dto_1 = require("./dto/update-payroll.dto");
const generate_payroll_dto_1 = require("./dto/generate-payroll.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let PayrollController = class PayrollController {
    payrollService;
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    create(req, createPayrollDto) {
        return this.payrollService.create(req.tenantId, createPayrollDto);
    }
    generate(req, generatePayrollDto) {
        return this.payrollService.generatePayroll(req.tenantId, generatePayrollDto);
    }
    findAll(req, start, end) {
        return this.payrollService.findAll(req.tenantId, start, end);
    }
    findOne(req, id) {
        return this.payrollService.findOne(req.tenantId, +id);
    }
    findByEmployer(req, id) {
        return this.payrollService.findByEmployerId(req.tenantId, +id);
    }
    update(req, id, updatePayrollDto) {
        return this.payrollService.update(req.tenantId, +id, updatePayrollDto);
    }
    remove(req, id) {
        return this.payrollService.remove(req.tenantId, +id);
    }
    submit(req, id, user) {
        return this.payrollService.submitPayroll(req.tenantId, +id, user.id);
    }
    approve(req, id, user) {
        return this.payrollService.approvePayroll(req.tenantId, +id, user.id);
    }
    pay(req, id, body) {
        return this.payrollService.payPayroll(req.tenantId, +id, body.paymentMethod, body.compteId, body.expenseAccountId);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a single payroll record manually' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_payroll_dto_1.CreatePayrollDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Generate payrolls for all or specific employers for a period' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_payroll_dto_1.GeneratePayrollDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payroll records with optional period filter' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single payroll record' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('employer/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payroll records for a specific employer' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "findByEmployer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a payroll record' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_payroll_dto_1.UpdatePayrollDto]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a payroll record' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('submit/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a payroll for approval' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('approve/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a payroll and create accounting expense' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('pay/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Mark payroll as paid and create treasury payment/journal entry' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "pay", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('payroll'),
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
