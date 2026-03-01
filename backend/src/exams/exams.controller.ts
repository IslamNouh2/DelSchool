import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ExamService } from './exams.service';
import { CreateExamDto } from './DTO/create-exam.dto';
import { UpdateExamDto } from './DTO/update-exam.dto';
import { UpsertGradesDto } from './DTO/upsert-grades.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Req, UseGuards } from '@nestjs/common';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) { }

  @Post()
  create(@TenantId() tenantId: string, @Body() createExamDto: CreateExamDto) {
    return this.examService.create(tenantId, createExamDto);
  }

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.examService.findAll(tenantId, page, limit, search);
  }

  @Get('exams')
  getExams(@TenantId() tenantId: string) {
    return this.examService.getExams(tenantId);
  }

  @Get('subjects/:classId/:examId')
  async getSubjectOfClass(
    @TenantId() tenantId: string,
    @Param('classId', ParseIntPipe) classId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.examService.getSubjectOfClass(tenantId, classId, examId);
  }

  @Post('grades')
  async saveGrades(@TenantId() tenantId: string, @Body() dto: UpsertGradesDto) {
    return this.examService.saveGrades(tenantId, dto);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.examService.findOne(tenantId, id);
  }

  @Get('student/:studentId')
  async getStudentGrades(@TenantId() tenantId: string, @Param('studentId', ParseIntPipe) studentId: number) {
    return this.examService.getStudentGrades(tenantId, studentId);
  }

  

  @Put(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.examService.update(tenantId, id, updateExamDto);
  }

  @Patch(':id/publish')
  togglePublish(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body('publish') publish: boolean,
  ) {
    return this.examService.togglePublish(tenantId, id, publish);
  }

  @Get('dashboard/stats')
  async getDashboardStats(@TenantId() tenantId: string) {
    return this.examService.getDashboardStats(tenantId);
  }

  @Get('dashboard/subject-performance')
  async getSubjectPerformance(@TenantId() tenantId: string) {
    return this.examService.getSubjectPerformance(tenantId);
  }

  @Get('dashboard/distribution')
  async getGradeDistribution(@TenantId() tenantId: string) {
    return this.examService.getGradeDistribution(tenantId);
  }

  @Get('dashboard/class-performance')
  async getClassPerformance(@TenantId() tenantId: string) {
    return this.examService.getClassPerformance(tenantId);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id', ParseIntPipe) id: number) {
    return this.examService.remove(tenantId, id);
  }

  @Get('dashboard/top-students')
  getTopStudents(@TenantId() tenantId: string, @Query('classId') classId?: string) {
    return this.examService.getTopStudents(tenantId, classId ? parseInt(classId) : undefined);
  }

  @Get('dashboard/upcoming')
  getUpcomingExams(@TenantId() tenantId: string, @Query('classId') classId?: string) {
    return this.examService.getUpcomingExams(tenantId, classId ? parseInt(classId) : undefined);
  }
}
