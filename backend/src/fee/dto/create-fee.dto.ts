import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateFeeDto {
    @IsString()
    title: string;

    @IsNumber()
    amount: number;

    @IsDateString()
    dueDate: string;

    @IsOptional()
    @IsNumber()
    studentId?: number;

    @IsOptional()
    @IsNumber()
    classId?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    compteId?: number;

    @IsOptional()
    @IsDateString()
    dateStartConsommation?: string;

    @IsOptional()
    @IsDateString()
    dateEndConsommation?: string;
}
