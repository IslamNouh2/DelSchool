import { Controller } from '@nestjs/common';
import { TeacherClassService } from './teacher-class.service';

@Controller('teacher-class')
export class TeacherClassController {
  constructor(private readonly teacherClassService: TeacherClassService) {}
}
