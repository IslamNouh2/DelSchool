import { Controller, Get } from '@nestjs/common';
import { StudentService } from './student.service';

@Controller('parent')
export class ParentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('count')
  async getCount() {
    return this.studentService.GetCountParent();
  }
}
