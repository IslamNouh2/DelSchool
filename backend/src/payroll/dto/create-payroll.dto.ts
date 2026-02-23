import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreatePayrollDto {
  @ApiProperty({ example: 1, description: 'ID of the employer' })
  @IsNotEmpty()
  @IsNumber()
  employerId: number;

  @ApiProperty({ example: '2024-01-01', description: 'Start date of the payroll period' })
  @IsNotEmpty()
  @IsDateString()
  period_start: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date of the payroll period' })
  @IsNotEmpty()
  @IsDateString()
  period_end: string;

  @ApiProperty({ example: 3000, description: 'Base salary of the employer' })
  @IsNotEmpty()
  @IsNumber()
  baseSalary: number;

  @ApiPropertyOptional({ example: 200, description: 'Additional allowances' })
  @IsOptional()
  @IsNumber()
  allowances?: number;

  @ApiPropertyOptional({ example: 50, description: 'Subtotal of deductions' })
  @IsOptional()
  @IsNumber()
  deductions?: number;

  @ApiProperty({ example: 3150, description: 'Net salary to be paid' })
  @IsNotEmpty()
  @IsNumber()
  netSalary: number;
}
