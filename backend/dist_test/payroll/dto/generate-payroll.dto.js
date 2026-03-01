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
exports.GeneratePayrollDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class GeneratePayrollDto {
    period_start;
    period_end;
    employerId;
    compteId;
    date;
    allowances;
}
exports.GeneratePayrollDto = GeneratePayrollDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01', description: 'Start date of the payroll period' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GeneratePayrollDto.prototype, "period_start", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-31', description: 'End date of the payroll period' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GeneratePayrollDto.prototype, "period_end", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Optional: specify an employer ID to generate payroll for only one person' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeneratePayrollDto.prototype, "employerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 45, description: 'Optional: specify the Expense Compte ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeneratePayrollDto.prototype, "compteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-02-01', description: 'The date to be set as the payroll creation date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GeneratePayrollDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 150.50, description: 'Additional allowances for all generated payrolls' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GeneratePayrollDto.prototype, "allowances", void 0);
