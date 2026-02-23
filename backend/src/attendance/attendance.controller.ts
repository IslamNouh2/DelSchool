import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
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
async saveStudentAttendance(@Body() body: any) {
  console.log("🧾 Received attendance payload:", JSON.stringify(body, null, 2));
  return this.service.saves(body);
}

  @Patch('student/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentAttendanceDto) {
    return this.service.updateStudent(Number(id), dto);
  }

  @Delete('student/:id')
  deleteStudent(@Param('id') id: string) {
    return this.service.deleteStudent(Number(id));
  }

  @Get('student')
  getStudents() {
    return this.service.getAllStudents();
  }

  @Get('students/:classId')
  async getStudentsByClass(@Param('classId', ParseIntPipe) classId: number) {
    return this.service.getStudentsByClassId(classId);
  }

  @Get('class')
  async findAll() {
    return this.service.getAllClasses();
  }

  @Get('existing/:classId/:date')
  async getExistingAttendance(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('date') date: string
  ) {
    return this.service.getExistingAttendance(classId, date);
  }
  
  // 👩‍🏫 Employer
  @Post('employer')
  createEmployer(@Body() dto: CreateEmployerAttendanceDto) {
    return this.service.createEmployer(dto);
  }

  @Patch('employer/:id')
  updateEmployer(@Param('id') id: string, @Body() dto: UpdateEmployerAttendanceDto) {
    return this.service.updateEmployer(Number(id), dto);
  }

  @Get('employer')
  getEmployers() {
    return this.service.getAllEmployers();
  }

  // Employers basic list for taking attendance
  @Get('employers')
  getEmployersBasic() {
    return this.service.getAllEmployerBasics();
  }

  // Existing employer attendance by date (?date=YYYY-MM-DD)
  @Get('employer-existing')
  getExistingEmployer(@Query('date') date: string) {
    return this.service.getExistingEmployerAttendance(date);
  }

  @Delete('employer/:id')
  deleteEmployerAttendance(@Param('id') id: string) {
    return this.service.deleteEmployerAttendance(Number(id));
  }

  @Get('student-last7days/:classId')
  getStudentLast7Days(@Param('classId', ParseIntPipe) classId: number) {
    return this.service.getStudentLast7DaysAttendance(classId);
  }

  @Get('employer-last7days')
  getEmployerLast7Days() {
    return this.service.getEmployerLast7DaysAttendance();
  }
  @Get('student-weekly-chart/:classId')
  getStudentWeeklyChart(@Param('classId', ParseIntPipe) classId: number) {
    return this.service.getStudentWeeklyChartData(classId);
  }

  @Get('student-daily-summary/:classId/:date')
  getStudentDailySummary(
    @Param('classId', ParseIntPipe) classId: number,
    @Param('date') date: string
  ) {
    return this.service.getStudentDailySummaryData(classId, date);
  }

  @Get('student/:id/history')
  getStudentAttendance(@Param('id', ParseIntPipe) id: number) {
    return this.service.getStudentAttendance(id);
  }

  @Get('global-weekly-chart')
  getGlobalWeeklyChart() {
    return this.service.getGlobalWeeklyChartData();
  }

  @Get('global-daily-summary/:date')
  getGlobalDailySummary(@Param('date') date: string) {
    return this.service.getGlobalDailySummaryData(date);
  }

  @Get('employer-weekly-chart')
  getEmployerWeeklyChart() {
    return this.service.getEmployerWeeklyChartData();
  }

  @Get('employer-daily-summary/:date')
  getEmployerDailySummary(@Param('date') date: string) {
    return this.service.getEmployerDailySummaryData(date);
  }

  @Get('employer/:id/stats')
  async getEmployerStats(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEmployerStats(id);
  }
}
