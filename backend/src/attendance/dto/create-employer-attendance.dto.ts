import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateEmployerAttendanceDto {
    @IsInt()
    employerId: number;

    @IsOptional()
    @IsDateString()
    checkInTime?: string;

    @IsOptional()
    @IsDateString()
    checkOutTime?: string;

    @IsOptional()
    @IsString()
    remarks?: string;

    @IsString()
    academicYear: string;
}
