import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SchoolYearService } from './school-year.service';

@Controller('school-year')
export class SchoolYearController {
  constructor(private readonly schoolYearService: SchoolYearService) {}

  @Post()
  create(@Body() createDto: { year: string; startDate: string; endDate: string; isCurrent?: boolean }) {
    return this.schoolYearService.create({
        ...createDto,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
    });
  }

  @Get()
  findAll() {
    return this.schoolYearService.findAll();
  }

  @Get('current')
  getCurrent() {
    return this.schoolYearService.getCurrentYear();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: { year?: string; startDate?: string; endDate?: string; isCurrent?: boolean }) {
    return this.schoolYearService.update(+id, {
        ...updateDto,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schoolYearService.remove(+id);
  }
}
