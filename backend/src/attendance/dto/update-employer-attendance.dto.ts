import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployerAttendanceDto } from './create-employer-attendance.dto';

export class UpdateEmployerAttendanceDto extends PartialType(CreateEmployerAttendanceDto) { }
