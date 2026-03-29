import { IsOptional, IsString, IsInt } from 'class-validator';

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

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  mode?: 'MANUAL' | 'AI_GENERATED';

  @IsOptional()
  aiOptimizationScore?: number;

  @IsOptional()
  aiGeneratedAt?: Date;
}
