import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeeService } from './fee.service';
import { Prisma } from '@prisma/client';

@Controller('fees')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  @Post()
  create(@Body() createFeeDto: Prisma.FeeCreateInput) {
    return this.feeService.create(createFeeDto);
  }

  @Get()
  findAll() {
    return this.feeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeeDto: Prisma.FeeUpdateInput) {
    return this.feeService.update(+id, updateFeeDto);
  }

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.feeService.getDashboardStats();
  }

  @Get('dashboard/types')
  getFeeTypes() {
    return this.feeService.getFeeTypes();
  }

  @Get('dashboard/student-status')
  getStudentFeeStatus() {
    return this.feeService.getDetailedFeeStatus();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feeService.remove(+id);
  }
}
