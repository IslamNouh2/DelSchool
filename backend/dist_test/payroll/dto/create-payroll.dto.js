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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePayrollDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePayrollDto {
    employerId;
    period_start;
    period_end;
    baseSalary;
    allowances;
    deductions;
    netSalary;
}
exports.CreatePayrollDto = CreatePayrollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID of the employer' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollDto.prototype, "employerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01', description: 'Start date of the payroll period' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePayrollDto.prototype, "period_start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-31', description: 'End date of the payroll period' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePayrollDto.prototype, "period_end", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3000, description: 'Base salary of the employer' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollDto.prototype, "baseSalary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 200, description: 'Additional allowances' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollDto.prototype, "allowances", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 50, description: 'Subtotal of deductions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollDto.prototype, "deductions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3150, description: 'Net salary to be paid' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollDto.prototype, "netSalary", void 0);
