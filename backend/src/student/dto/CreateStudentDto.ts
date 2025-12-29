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
    matherName: string;

    @IsOptional()
    @IsString()
    fatherNumber: string;

    @IsOptional()
    @IsString()
    matherNumber: string;

    @IsOptional()
    @IsString()
    matherJob: string;

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
    localId: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    classId?: number;

    @IsOptional()
    @IsString()
    academicYear?: string;
}
