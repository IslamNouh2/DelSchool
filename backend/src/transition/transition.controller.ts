import { Controller, Get, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { TransitionService } from './transition.service';

@Controller('transition')
export class TransitionController {
  constructor(private readonly transitionService: TransitionService) {}

  @Get('passing-students')
  getPassingStudents(@Query('classId', ParseIntPipe) classId: number) {
    return this.transitionService.getPassingStudents(classId);
  }

  @Post('process')
  transitionStudents(@Body() dto: {
    nextYear: string,
    transitions: { studentId: number, studentClassId: number, nextClassId: number }[]
  }) {
    return this.transitionService.transitionStudents(dto);
  }
}
