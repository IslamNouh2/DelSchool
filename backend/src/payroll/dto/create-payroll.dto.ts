import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePayrollDto {
  @IsNotEmpty()
  @IsNumber()
  employerId: number;

  @IsNotEmpty()
  @IsDateString()
  period_start: string;

  @IsNotEmpty()
  @IsDateString()
  period_end: string;

  @IsNotEmpty()
  @IsNumber()
  baseSalary: number;

  @IsOptional()
  @IsNumber()
  allowances?: number;

  @IsOptional()
  @IsNumber()
  deductions?: number;

  @IsNotEmpty()
  @IsNumber()
  netSalary: number;
}
