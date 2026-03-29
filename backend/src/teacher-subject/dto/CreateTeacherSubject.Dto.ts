// src/teacher-subject/dto/create-teacher-subject-bulk.dto.ts
import { IsInt, IsArray } from 'class-validator';

export class CreateteacherSubjectDto {
  @IsInt()
  employerId: number;

  @IsArray()
  subjectIds: number[];
}
