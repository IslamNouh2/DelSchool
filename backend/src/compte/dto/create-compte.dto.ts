import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCompteDto {
    @IsString()
    name: string;

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
