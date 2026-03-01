import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SchoolYearService } from './school-year.service';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('school-year')

export class SchoolYearController {
  constructor(private readonly schoolYearService: SchoolYearService) {}

  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() createDto: { year: string; startDate: string; endDate: string; isCurrent?: boolean }
  ) {
    return this.schoolYearService.create(tenantId, {
        ...createDto,
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
    });
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.schoolYearService.findAll(tenantId);
  }

  @Get('current')
  getCurrent(@TenantId() tenantId: string) {
    return this.schoolYearService.getCurrentYear(tenantId);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string, 
    @Body() updateDto: { year?: string; startDate?: string; endDate?: string; isCurrent?: boolean }
  ) {
    return this.schoolYearService.update(tenantId, +id, {
        ...updateDto,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
    });
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.schoolYearService.remove(tenantId, +id);
  }
}
