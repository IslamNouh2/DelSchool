import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';
import { UpdateEmployerAttendanceDto } from './dto/update-employer-attendance.dto';


@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) { }

  // 🧒 Student
  @Post('student')
  createStudent(@Body() dto: CreateStudentAttendanceDto) {
    return this.service.createStudent(dto);
  }

  @Patch('student/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentAttendanceDto) {
    return this.service.updateStudent(Number(id), dto);
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
}
