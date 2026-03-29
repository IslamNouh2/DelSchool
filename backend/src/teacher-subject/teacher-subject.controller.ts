import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeacherSubjectService } from './teacher-subject.service';
import { CreateteacherSubjectDto } from './dto/CreateTeacherSubject.Dto';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('teacher-subject')
export class TeacherSubjectController {
  constructor(private readonly teacherSubjectService: TeacherSubjectService) {}

  @Post()
  async bulkInsert(
    @TenantId() tenantId: string,
    @Body() dto: CreateteacherSubjectDto,
  ) {
    return this.teacherSubjectService.bulkInsert(tenantId, dto);
  }

  @Get(':employerId')
  async getSubjectsByTeacher(
    @TenantId() tenantId: string,
    @Param('employerId', ParseIntPipe) employerId: number,
  ) {
    return this.teacherSubjectService.getSubjectsByTeacher(
      tenantId,
      employerId,
    );
  }

  @Get('subject/:subjectId')
  getTeacherBySubject(
    @TenantId() tenantId: string,
    @Param('subjectId') subjectId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.teacherSubjectService.getTeacherBySubject(
      tenantId,
      +subjectId,
      academicYear,
    );
  }

  @Delete(':employerId/:subjectId')
  removeSubjectFromTeacher(
    @TenantId() tenantId: string,
    @Param('employerId', ParseIntPipe) employerId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.teacherSubjectService.removeSubjectFromTeacher(
      tenantId,
      employerId,
      subjectId,
    );
  }
}
