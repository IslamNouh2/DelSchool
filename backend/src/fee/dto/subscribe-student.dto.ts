import { IsArray, IsNumber, IsDateString } from 'class-validator';

export class SubscribeStudentDto {
  @IsNumber()
  studentId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  templateIds: number[];

  @IsDateString()
  dueDate: string;
}
