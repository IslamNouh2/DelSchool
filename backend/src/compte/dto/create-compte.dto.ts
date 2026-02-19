import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { CompteCategory, AccountNature } from '@prisma/client';

export class CreateCompteDto {
    @IsOptional()
    @IsString()
    code?: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsOptional()
    @IsNumber()
    parentId?: number;

    @IsOptional()
    @IsBoolean()
    isPosted?: boolean;

    @IsOptional()
    @IsNumber()
    employerId?: number | null;

    @IsOptional()
    @IsNumber()
    studentId?: number | null;

    @IsOptional()
    @IsBoolean()
    isFeeCash?: boolean;

    @IsOptional()
    @IsBoolean()
    showInParent?: boolean;

    @IsOptional()
    @IsOptional()
    @IsEnum(CompteCategory)
    category?: CompteCategory;

    @IsEnum(AccountNature)
    nature: AccountNature;

    @IsOptional()
    @IsString()
    selectionCode?: string | null;



}
