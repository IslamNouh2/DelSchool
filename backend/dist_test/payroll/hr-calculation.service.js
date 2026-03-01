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
exports.HRCalculationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const parameter_service_1 = require("../parameter/parameter.service");
let HRCalculationService = class HRCalculationService {
    parameterService;
    constructor(parameterService) {
        this.parameterService = parameterService;
    }
    /**
     * Calculates salary based on attendance and base salary.
     */
    async calculateSalary(baseSalary, attendances, allowances = 0, salaryBasis = 'DAILY') {
        const salary = typeof baseSalary === 'number' ? baseSalary : baseSalary.toNumber();
        // Fetch rules from settings
        const [monthlyDays, lateRatio] = await Promise.all([
            this.parameterService.getMonthlyDays(),
            this.parameterService.getLatePenaltyRatio(),
        ]);
        let dailySalary = 0;
        if (salaryBasis === 'HOURLY') {
            // If hourly, 'salary' input is actually hourlyRate. 
            // Assumption: 8 hours per day for calculating dailyRate/deductions
            dailySalary = salary * 8;
        }
        else {
            dailySalary = salary / monthlyDays;
        }
        const summary = {
            totalDays: attendances.length,
            present: attendances.filter((a) => a.status === client_1.AttendanceStatus.PRESENT).length,
            absent: attendances.filter((a) => a.status === client_1.AttendanceStatus.ABSENT).length,
            late: attendances.filter((a) => a.status === client_1.AttendanceStatus.LATE).length,
            excused: attendances.filter((a) => a.status === client_1.AttendanceStatus.EXCUSED).length,
        };
        const latePenaltyDays = Math.floor(summary.late / lateRatio);
        const totalDeductionDays = summary.absent + latePenaltyDays;
        const absentDeduction = summary.absent * dailySalary;
        const lateDeduction = latePenaltyDays * dailySalary;
        const totalDeduction = absentDeduction + lateDeduction;
        // Net Salary calculation
        // If DAILY: baseSalary - deductions + allowances
        // If HOURLY: (totalPresentHours * hourlyRate) - deductions? 
        // Usually backend assumes monthly base anyway, so let's stick to base - deduction.
        const netSalary = (salaryBasis === 'HOURLY' ? (salary * 8 * monthlyDays) : salary) - totalDeduction + allowances;
        return {
            baseSalary: salary,
            dailySalary: parseFloat(dailySalary.toFixed(2)),
            absentDays: summary.absent,
            lateDays: summary.late,
            latePenaltyDays,
            totalDeductionDays,
            absentDeduction: parseFloat(absentDeduction.toFixed(2)),
            lateDeduction: parseFloat(lateDeduction.toFixed(2)),
            totalDeduction: parseFloat(totalDeduction.toFixed(2)),
            allowances,
            netSalary: parseFloat(netSalary.toFixed(2)),
            attendanceSummary: summary,
        };
    }
};
exports.HRCalculationService = HRCalculationService;
exports.HRCalculationService = HRCalculationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [parameter_service_1.ParameterService])
], HRCalculationService);
