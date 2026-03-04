import { Controller, Post, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AiService } from './ai.service';
import { TeacherEvaluationService } from './teacher-evaluation.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly teacherEvaluationService: TeacherEvaluationService,
  ) {}

  @Post('risk/:studentId')
  async calculateStudentRisk(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.aiService.calculateStudentRisk(studentId);
  }

  @Get('risk/:studentId')
  async getStudentRisk(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.aiService.getStudentRisk(studentId);
  }

  @Post('teacher-performance/:teacherId')
  async evaluateTeacher(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.teacherEvaluationService.evaluateTeacher(teacherId);
  }

  @Get('teacher-performance/:teacherId')
  async getTeacherEvaluations(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.teacherEvaluationService.getTeacherEvaluations(teacherId);
  }
}
