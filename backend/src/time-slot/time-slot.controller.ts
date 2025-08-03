import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { TimeSlotService } from './time-slot.service';
import { UpdateTimeSlotDto } from './dto/UpdateTimeSlotDto';
import { CreateTimeSlotDto } from './dto/CreateTimeSlotDto';

@Controller('time-slots')
export class TimeSlotController {
  constructor(private readonly service: TimeSlotService) { }

  @Post()
  create(@Body() dto: CreateTimeSlotDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimeSlotDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
