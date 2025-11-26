import { IsInt, IsArray, ValidateNested, IsString, IsDateString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { AttendanceStatus } from "@prisma/client";

class AttendanceRecordDto {
    @IsInt()
    studentId: number;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;
}

export class SaveStudentAttendanceDto {
    @IsInt()
    classId: number;

    @IsString()
    academicYear: string;

    @IsDateString()
    date: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttendanceRecordDto)
    records: AttendanceRecordDto[];
}