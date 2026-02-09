import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsString,
    IsDateString,
    IsOptional,
    IsInt,
    IsBoolean,
} from 'class-validator';

export class CreateStudentDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsDateString()
    dateOfBirth: string; // Accept ISO string from form

    @IsNotEmpty()
    @IsString()
    gender: string;

    @IsNotEmpty()
    @IsString()
    address: string;

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

    @IsNotEmpty()  // Add this decorator
    @IsString()
    code: string;

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

    @IsNotEmpty()
    @IsDateString()
    dateInscription: string;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    okBlock?: boolean;

    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    localId: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    classId?: number;

    @IsOptional()
    @IsString()
    academicYear?: string;
}
