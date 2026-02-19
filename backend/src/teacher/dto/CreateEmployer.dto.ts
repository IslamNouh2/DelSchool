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

export class CreateEmployerDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsDateString()
    dateOfBirth: string;

    @IsOptional()
    @IsString()
    lieuOfBirth?: string;

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

    @IsNotEmpty()
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

    @IsNotEmpty()
    @IsString()
    type: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

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
}
