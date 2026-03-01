import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { SaveStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';
import { UpdateEmployerAttendanceDto } from './dto/update-employer-attendance.dto';


@Controller('attendance')

export class AttendanceController {
  constructor(private readonly service: AttendanceService) { }

  // 🧒 Student
  @Post('save')
async saveStudentAttendance(@Req() req: any, @Body() body: any) {
  console.log("🧾 Received attendance payload:", JSON.stringify(body, null, 2));
  return this.service.saves(req.tenantId, body);
}

  @Patch('student/:id')
  updateStudent(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStudentAttendanceDto) {
    return this.service.updateStudent(req.tenantId, Number(id), dto);
  }

  @Delete('student/:id')
  deleteStudent(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteStudent(req.tenantId, Number(id));
  }

  @Get('student')
  getStudents(@Req() req: any) {
    return this.service.getAllStudents(req.tenantId);
  }

  @Get('students/:classId')
  async getStudentsByClass(@Req() req: any, @Param('classId', ParseIntPipe) classId: number) {
    return this.service.getStudentsByClassId(req.tenantId, classId);
  }

  @Get('class')
  async findAll(@Req() req: any) {
    return this.service.getAllClasses(req.tenantId);
  }

  @Get('existing/:classId/:date')
  async getExistingAttendance(
    @Req() req: any,
    @Param('classId', ParseIntPipe) classId: number,
    @Param('date') date: string
  ) {
    return this.service.getExistingAttendance(req.tenantId, classId, date);
  }
  
  // 👩‍🏫 Employer
  @Post('employer')
  createEmployer(@Req() req: any, @Body() dto: CreateEmployerAttendanceDto) {
    return this.service.createEmployer(req.tenantId, dto);
  }

  @Patch('employer/:id')
  updateEmployer(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateEmployerAttendanceDto) {
    return this.service.updateEmployer(req.tenantId, Number(id), dto);
  }

  @Get('employer')
  getEmployers(@Req() req: any) {
    return this.service.getAllEmployers(req.tenantId);
  }

  // Employers basic list for taking attendance
  @Get('employers')
  getEmployersBasic(@Req() req: any) {
    return this.service.getAllEmployerBasics(req.tenantId);
  }

  // Existing employer attendance by date (?date=YYYY-MM-DD)
  @Get('employer-existing')
  getExistingEmployer(@Req() req: any, @Query('date') date: string) {
    return this.service.getExistingEmployerAttendance(req.tenantId, date);
  }

  @Delete('employer/:id')
  deleteEmployerAttendance(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteEmployerAttendance(req.tenantId, Number(id));
  }

  @Get('student-last7days/:classId')
  getStudentLast7Days(@Req() req: any, @Param('classId', ParseIntPipe) classId: number) {
    return this.service.getStudentLast7DaysAttendance(req.tenantId, classId);
  }

  @Get('employer-last7days')
  getEmployerLast7Days(@Req() req: any) {
    return this.service.getEmployerLast7DaysAttendance(req.tenantId);
  }
  @Get('student-weekly-chart/:classId')
  getStudentWeeklyChart(@Req() req: any, @Param('classId', ParseIntPipe) classId: number) {
    return this.service.getStudentWeeklyChartData(req.tenantId, classId);
  }

  @Get('student-daily-summary/:classId/:date')
  getStudentDailySummary(
    @Req() req: any,
    @Param('classId', ParseIntPipe) classId: number,
    @Param('date') date: string
  ) {
    return this.service.getStudentDailySummaryData(req.tenantId, classId, date);
  }

  @Get('student/:id/history')
  getStudentAttendance(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.getStudentAttendance(req.tenantId, id);
  }

  @Get('global-weekly-chart')
  getGlobalWeeklyChart(@Req() req: any) {
    return this.service.getGlobalWeeklyChartData(req.tenantId);
  }

  @Get('global-daily-summary/:date')
  getGlobalDailySummary(@Req() req: any, @Param('date') date: string) {
    return this.service.getGlobalDailySummaryData(req.tenantId, date);
  }

  @Get('employer-weekly-chart')
  getEmployerWeeklyChart(@Req() req: any) {
    return this.service.getEmployerWeeklyChartData(req.tenantId);
  }

  @Get('employer-daily-summary/:date')
  getEmployerDailySummary(@Req() req: any, @Param('date') date: string) {
    return this.service.getEmployerDailySummaryData(req.tenantId, date);
  }

  @Get('employer/:id/stats')
  async getEmployerStats(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.getEmployerStats(req.tenantId, id);
  }
}
