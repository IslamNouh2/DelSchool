import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'John', description: 'First name of the student' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the student' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    example: '2010-05-15',
    description: 'Date of birth (ISO string)',
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string; // Accept ISO string from form

  @ApiProperty({ example: 'Male', description: 'Gender of the student' })
  @IsNotEmpty()
  @IsString()
  gender: string;

  @ApiProperty({
    example: '123 Main St, City',
    description: 'Address of the student',
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+123456789', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId: number;

  @IsOptional()
  @IsString()
  fatherName: string;

  @IsOptional()
  @IsString()
  motherName: string;

  @IsOptional()
  @IsString()
  fatherNumber: string;

  @IsOptional()
  @IsString()
  motherNumber: string;

  @IsOptional()
  @IsString()
  motherJob: string;

  @IsOptional()
  @IsString()
  fatherJob: string;

  @ApiPropertyOptional({
    example: 'STU12345',
    description: 'Unique student code',
  })
  @IsOptional()
  @IsString()
  code?: string;

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
  lieuOfBirth?: string;

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

  @ApiProperty({ example: '2023-09-01', description: 'Date of inscription' })
  @IsNotEmpty()
  @IsDateString()
  dateInscription: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  okBlock?: boolean;

  @ApiProperty({ example: 1, description: 'Local ID' })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  localId: number;

  @ApiPropertyOptional({ example: 1, description: 'Class ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  classId?: number;

  @IsOptional()
  @IsString()
  academicYear?: string;
}
