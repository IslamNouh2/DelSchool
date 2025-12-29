import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCompteDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsNumber()
    parentId?: number;

    @IsOptional()
    @IsBoolean()
    okBlock?: boolean;

    @IsOptional()
    @IsNumber()
    employerId?: number;

    @IsOptional()
    @IsNumber()
    studentId?: number;
}
