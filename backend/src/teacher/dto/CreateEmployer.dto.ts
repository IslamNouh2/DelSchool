import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployerDto {
  @ApiProperty({ example: 'Jane', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1985-10-20', description: 'Date of birth' })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  lieuOfBirth?: string;

  @ApiProperty({ example: 'Female', description: 'Gender' })
  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  fatherName?: string;

  @IsOptional()
  @IsString()
  motherName?: string;

  // @ApiProperty({ example: 'EMP123', description: 'Unique employer code' })
  // @IsNotEmpty()
  // @IsString()
  // code: string;

  @IsOptional()
  @IsString()
  health?: string;

  @IsOptional()
  @IsDateString()
  dateCreate?: string;

  @IsOptional()
  @IsDateString()
  dateModif?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  etatCivil?: string;

  @IsOptional()
  @IsString()
  cid?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  numNumerisation?: string;

  @IsOptional()
  @IsDateString()
  dateInscription?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  okBlock?: boolean;

  @ApiProperty({
    example: 'TEACHER',
    description: 'Type of employer (TEACHER, STAFF)',
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  photoFileName?: string;
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  weeklyWorkload?: number;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  salary?: number;

  @IsOptional()
  @IsString()
  salaryBasis?: string;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;
}
