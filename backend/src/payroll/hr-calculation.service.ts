import { Injectable } from '@nestjs/common';
import { AttendanceStatus, EmployerAttendance } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface SalaryCalculationResult {
  baseSalary: number;
  dailySalary: number;
  absentDays: number;
  lateDays: number;
  latePenaltyDays: number;
  totalDeductionDays: number;
  absentDeduction: number;
  lateDeduction: number;
  totalDeduction: number;
  allowances: number;
  netSalary: number;
  attendanceSummary: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

import { ParameterService } from '../parameter/parameter.service';

@Injectable()
export class HRCalculationService {
  constructor(private readonly parameterService: ParameterService) {}

  /**
   * Calculates salary based on attendance and base salary.
   */
  async calculateSalary(
    baseSalary: number | Decimal,
    attendances: EmployerAttendance[],
    allowances: number = 0,
    salaryBasis: string = 'DAILY', // Added parameter
  ): Promise<SalaryCalculationResult> {
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
    } else {
      dailySalary = salary / monthlyDays;
    }

    const summary = {
      totalDays: attendances.length,
      present: attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length,
      absent: attendances.filter((a) => a.status === AttendanceStatus.ABSENT).length,
      late: attendances.filter((a) => a.status === AttendanceStatus.LATE).length,
      excused: attendances.filter((a) => a.status === AttendanceStatus.EXCUSED).length,
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
}
