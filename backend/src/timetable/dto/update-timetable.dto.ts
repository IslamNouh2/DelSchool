import { IsOptional, IsString, IsInt } from 'class-validator'

export class UpdateTimetableDto {
    @IsOptional()
    @IsInt()
    subjectId?: number;

    @IsOptional()
    @IsInt()
    timeSlotId?: number;

    @IsOptional()
    @IsString()
    day?: string;

    @IsOptional()
    @IsInt()
    employerId?: number;
}
