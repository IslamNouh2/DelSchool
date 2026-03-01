import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TimeSlotService } from './time-slot.service';
import { UpdateTimeSlotDto } from './dto/UpdateTimeSlotDto';
import { CreateTimeSlotDto } from './dto/CreateTimeSlotDto';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('time-slots')

export class TimeSlotController {
  constructor(private readonly service: TimeSlotService) { }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateTimeSlotDto) {
    return this.service.create(tenantId, dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string, 
    @Body() dto: UpdateTimeSlotDto
  ) {
    return this.service.update(tenantId, +id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.remove(tenantId, +id);
  }
}
