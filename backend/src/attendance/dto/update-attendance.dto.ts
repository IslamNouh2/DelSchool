import { PartialType } from '@nestjs/mapped-types';
import { SaveStudentAttendanceDto } from './create-student-attendance.dto';

export class UpdateStudentAttendanceDto extends PartialType(SaveStudentAttendanceDto) { }
