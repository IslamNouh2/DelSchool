import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateExamDto {
    @IsString()
    @IsNotEmpty()
    examName: string;

    @IsDateString()
    @IsNotEmpty()
    dateStart: string;

    @IsDateString()
    @IsNotEmpty()
    dateEnd: string;

    @IsBoolean()
    @IsOptional()
    publish?: boolean;
}

