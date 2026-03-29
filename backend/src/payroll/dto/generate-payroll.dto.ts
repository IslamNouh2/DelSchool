import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class GeneratePayrollDto {
  @ApiProperty({
    example: '2024-01-01',
    description: 'Start date of the payroll period',
  })
  @IsNotEmpty()
  @IsDateString()
  period_start: string;

  @ApiProperty({
    example: '2024-01-31',
    description: 'End date of the payroll period',
  })
  @IsNotEmpty()
  @IsDateString()
  period_end: string;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Optional: specify an employer ID to generate payroll for only one person',
  })
  @IsOptional()
  @IsNumber()
  employerId?: number;

  @ApiPropertyOptional({
    example: 45,
    description: 'Optional: specify the Expense Compte ID',
  })
  @IsOptional()
  @IsNumber()
  compteId?: number;

  @ApiPropertyOptional({
    example: '2024-02-01',
    description: 'The date to be set as the payroll creation date',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 150.5,
    description: 'Additional allowances for all generated payrolls',
  })
  @IsOptional()
  @IsNumber()
  allowances?: number;
}
