import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePayrollDto } from './create-payroll.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PayrollStatus } from '@prisma/client';

export class UpdatePayrollDto extends PartialType(CreatePayrollDto) {
  @ApiPropertyOptional({ enum: PayrollStatus, example: PayrollStatus.APPROVED })
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;
}
