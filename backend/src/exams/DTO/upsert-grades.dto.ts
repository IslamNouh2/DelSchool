import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class GradeDto {
  @IsInt()
  studentId: number;

  @IsInt()
  subjectId: number;

  @IsNumber()
  grade: number;
}

export class UpsertGradesDto {
  @IsInt()
  classId: number;

  @IsInt()
  examId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeDto)
  grades: GradeDto[];
}
