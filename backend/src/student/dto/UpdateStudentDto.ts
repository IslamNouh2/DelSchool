import { Type } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsInt, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateStudentDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsInt()
    parentId?: number;

    @IsOptional()
    @IsString()
    fatherName?: string;

    @IsOptional()
    @IsString()
    fatherNumber?: string;

    @IsOptional()
    @IsString()
    matherName?: string;

    @IsOptional()
    @IsString()
    matherNumber?: string;

    @IsOptional()
    @IsString()
    fatherJob?: string;

    @IsOptional()
    @IsString()
    matherJob?: string;

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

    @IsOptional()
    @IsDateString()
    dateInscription?: string;

    @IsOptional()
    photo?: Buffer;

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
