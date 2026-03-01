import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { TimetableService } from "./timetable.service";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Req, UseGuards } from '@nestjs/common';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) { }

  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateTimetableDto) {
    return this.service.create(tenantId, dto);
  }


  @Get()
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
}
