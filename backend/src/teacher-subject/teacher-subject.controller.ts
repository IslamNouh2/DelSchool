import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TeacherSubjectService } from './teacher-subject.service';
import { CreateteacherSubjectDto } from './dto/CreateTeacherSubject.Dto';

@Controller('teacher-subject')
export class TeacherSubjectController {
  constructor(private readonly teacherSubjectService: TeacherSubjectService) { }
  
  @Post()
  async bulkInsert(@Body() dto: CreateteacherSubjectDto) {
    return this.teacherSubjectService.bulkInsert(dto);
  }

  @Get(':employerId')
  async getSubjectsByTeacher(@Param('employerId', ParseIntPipe) employerId: number) {
    return this.teacherSubjectService.getSubjectsByTeacher(employerId);
  }

  @Get('subject/:subjectId')
  getTeacherBySubject(
    @Param('subjectId') subjectId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.teacherSubjectService.getTeacherBySubject(+subjectId, academicYear);
  }


  @Delete(':employerId/:subjectId')
  removeSubjectFromTeacher(
    @Param('employerId', ParseIntPipe) employerId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.teacherSubjectService.removeSubjectFromTeacher(employerId, subjectId);
  }
}
