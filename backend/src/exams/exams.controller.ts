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
@Controller('exam')
// @UseGuards(AuthGuard) // Uncomment if you have authentication
export class ExamController {
  constructor(private readonly examService: ExamService) { }

  @Post()
  create(@Body() createExamDto: CreateExamDto) {
    return this.examService.create(createExamDto);
  }

  @Get()
  findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.examService.findAll(page, limit, search);
  }

  @Get('exams')
  getExams() {
    return this.examService.getExams();
  }

  @Get('subjects/:classId/:examId')
  async getSubjectOfClass(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('examId', ParseIntPipe) examId: number,
  ) {
    return this.examService.getSubjectOfClass(classId, examId);
  }

  @Post('grades')
  async saveGrades(@Body() dto: UpsertGradesDto) {
    return this.examService.saveGrades(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examService.findOne(id);
  }

  @Get('student/:studentId')
  async getStudentGrades(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.examService.getStudentGrades(studentId);
  }

  

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExamDto: UpdateExamDto,
  ) {
    return this.examService.update(id, updateExamDto);
  }

  @Patch(':id/publish')
  togglePublish(
    @Param('id', ParseIntPipe) id: number,
    @Body('publish') publish: boolean,
  ) {
    return this.examService.togglePublish(id, publish);
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.examService.getDashboardStats();
  }

  @Get('dashboard/subject-performance')
  async getSubjectPerformance() {
    return this.examService.getSubjectPerformance();
  }

  @Get('dashboard/distribution')
  async getGradeDistribution() {
    return this.examService.getGradeDistribution();
  }

  @Get('dashboard/class-performance')
  async getClassPerformance() {
    return this.examService.getClassPerformance();
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examService.remove(id);
  }
}
