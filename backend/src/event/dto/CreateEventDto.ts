import { IsNotEmpty, IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateEventDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsDateString()
    startTime: string;

    @IsNotEmpty()
    @IsDateString()
    endTime: string;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}
