import { IsDateString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class GeneratePayrollDto {
  @IsNotEmpty()
  @IsDateString()
  period_start: string;

  @IsNotEmpty()
  @IsDateString()
  period_end: string;

  @IsOptional()
  @IsNumber()
  employerId?: number;

  @IsOptional()
  @IsNumber()
  compteId?: number;
  
  @IsNotEmpty()
  @IsDateString()
  date?: string; // Payload date (Expense Date)
}
