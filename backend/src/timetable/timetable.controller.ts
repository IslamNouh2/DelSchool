import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { TimetableService } from "./timetable.service";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Req, UseGuards } from '@nestjs/common';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@ApiTags('Timetable')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new timetable entry' })
  @ApiResponse({ status: 201, description: 'Timetable entry successfully created' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateTimetableDto) {
    return this.service.create(tenantId, dto);
  }


  @Get()
  @ApiOperation({ summary: 'Get all timetable entries' })
  @ApiResponse({ status: 200, description: 'Returns all timetable entries' })
  getAll(@TenantId() tenantId: string) {
    return this.service.getAll(tenantId);
  }

  @Get('class/:id')
  getByClass(@TenantId() tenantId: string, @Param('id') id: number) {
    return this.service.getByClass(tenantId, +id);
  }

  @Get('teacher/:id')
  getByTeacher(@TenantId() tenantId: string, @Param('id') id: number) {
    return this.service.getByTeacher(tenantId, +id);
  }

  @Get('student/:id')
  getByStudent(@TenantId() tenantId: string, @Param('id') id: number) {
    return this.service.getByStudent(tenantId, +id);
  }

  @Get('check')
  @ApiOperation({ summary: 'Check for duplicate timetable entry' })
  @ApiQuery({ name: 'day', required: true })
  @ApiQuery({ name: 'classId', required: true })
  @ApiQuery({ name: 'timeSlotId', required: true })
  @ApiQuery({ name: 'academicYear', required: true })
  @ApiResponse({ status: 200, description: 'Returns duplication status' })
  async checkDuplicate(
    @TenantId() tenantId: string,
    @Query('day') day: string,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('timeSlotId', ParseIntPipe) timeSlotId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.checkDuplicate(tenantId, day, classId, timeSlotId, academicYear);
  }

  @Put(':id')
  update(@TenantId() tenantId: string, @Param('id') id: number, @Body() dto: UpdateTimetableDto) {
    return this.service.update(tenantId, +id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: number) {
    return this.service.remove(tenantId, +id);
  }

  @Post('generate-ai')
  @ApiOperation({ summary: 'Generate optimized timetable using AI' })
  @ApiResponse({ status: 201, description: 'AI Timetable successfully generated' })
  async generateAI(
    @TenantId() tenantId: string,
    @Body('academicYear') academicYear: string,
  ) {
    return this.service.generateAI(tenantId, academicYear);
  }

  @Get(':id/optimization-score')
  @ApiOperation({ summary: 'Get optimization score for a timetable' })
  @ApiResponse({ status: 200, description: 'Returns optimization score' })
  async getOptimizationScore(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getOptimizationScore(tenantId, id);
  }
}
