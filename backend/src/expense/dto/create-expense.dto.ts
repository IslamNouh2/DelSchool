import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PaymentDto {
  @IsNumber()
  treasuryId: number;

  @IsString()
  method: string;
}

export class CreateExpenseDto {
  @IsString()
  title: string;

  @IsNumber()
  amount: number;

  @IsString()
  category: string; // Could be enum

  @IsDateString()
  expenseDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isAmortization?: boolean;

  @IsOptional()
  @IsDateString()
  dateStartConsommation?: string;

  @IsOptional()
  @IsDateString()
  dateEndConsommation?: string;

  @IsOptional()
  @IsNumber()
  compteId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDto)
  payment?: PaymentDto;
}
