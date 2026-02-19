import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollDto } from './create-payroll.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PayrollStatus } from '@prisma/client';

export class UpdatePayrollDto extends PartialType(CreatePayrollDto) {
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;
}
