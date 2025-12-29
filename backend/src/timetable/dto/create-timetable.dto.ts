import { IsEnum, IsInt, IsString, IsOptional } from "class-validator";

export class CreateTimetableDto {
    @IsEnum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    day: string;

    @IsInt()
    classId: number;

    @IsInt()
    subjectId: number;

    @IsInt()
    timeSlotId: number;

    @IsOptional()
    @IsInt()
    employerId?: number;

    @IsString()
    academicYear: string;
}
