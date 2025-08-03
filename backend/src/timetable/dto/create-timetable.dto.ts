import { IsEnum, IsInt, IsString } from "class-validator";

export class CreateTimetableDto {
    @IsEnum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    day: string;

    @IsInt()
    classId: number;

    @IsInt()
    subjectId: number;

    @IsInt()
    timeSlotId: number;

    @IsInt()
    employerId: number;

    @IsString()
    academicYear: string;
}
