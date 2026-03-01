"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollModule = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const payroll_controller_1 = require("./payroll.controller");
const prisma_module_1 = require("prisma/prisma.module");
const compte_module_1 = require("src/compte/compte.module");
const hr_calculation_service_1 = require("./hr-calculation.service");
const payroll_approval_service_1 = require("./payroll-approval.service");
const parameter_module_1 = require("../parameter/parameter.module");
let PayrollModule = class PayrollModule {
};
exports.PayrollModule = PayrollModule;
exports.PayrollModule = PayrollModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, compte_module_1.CompteModule, parameter_module_1.ParameterModule],
        controllers: [payroll_controller_1.PayrollController],
        providers: [payroll_service_1.PayrollService, hr_calculation_service_1.HRCalculationService, payroll_approval_service_1.PayrollApprovalService],
        exports: [payroll_service_1.PayrollService],
    })
], PayrollModule);
