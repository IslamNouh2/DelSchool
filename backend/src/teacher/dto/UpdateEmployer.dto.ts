import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateEmployerDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() motherName?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() health?: string;
  @IsOptional() @IsDateString() dateCreate?: string;
  @IsOptional() @IsDateString() dateModif?: string;
  @IsOptional() @IsString() lieuOfBirth?: string;
  @IsOptional() @IsString() bloodType?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() etatCivil?: string;
  @IsOptional() @IsString() cid?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() observation?: string;
  @IsOptional() @IsString() numNumerisation?: string;
  @IsOptional() @IsDateString() dateInscription?: string;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  okBlock?: boolean;
  @IsOptional() @IsString() type?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  weeklyWorkload?: number;

  @IsOptional()
  @Min(0)
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseFloat(value);
    return value;
  })
  salary?: number;

  @IsOptional() @IsString() salaryBasis?: string;
  @IsOptional() @IsString() checkInTime?: string;
  @IsOptional() @IsString() checkOutTime?: string;
}
