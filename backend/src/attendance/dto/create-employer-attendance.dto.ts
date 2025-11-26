import { IsDateString, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateEmployerAttendanceDto {
    @IsInt()
    employerId: number;

    @IsDateString()
    date: string;

    @IsOptional()
    @IsDateString()
    checkInTime?: string;

    @IsOptional()
    @IsDateString()
    checkOutTime?: string;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsString()
    academicYear: string;
}
