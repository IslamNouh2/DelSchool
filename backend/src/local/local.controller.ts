import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { LocalService } from './local.service';
import { CreateLocalDto } from './DTO/CreateLocal.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TenantId } from 'src/auth/decorators/tenant-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('local')
export class LocalController {
  constructor(private readonly localService: LocalService) { }


  @Get()
  async getLocals(
    @TenantId() tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sort') sort: string,
    @Query('search') search: string
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const validSortFields = ['dateCreate', 'code', 'name', 'NumClass']
    const orderByField = validSortFields.includes(sort) ? sort : 'name'
    return this.localService.GetLocal(tenantId, pageNumber, limitNumber, orderByField, search);
  }

  @Post('create')
  async CreateLocal(@TenantId() tenantId: string, @Body() dto: CreateLocalDto) {
    const Local = await this.localService.CreateLocal(tenantId, dto);
    return Local;
  }


  @Delete(':id')
  async DeleteLocal(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number
  ) {
    const Delete = await this.localService.DeleteLocal(tenantId, id);
    return { message: 'Local deleted successfully' };
  }


  @Put('/:id')
  async UpdateLocals(
    @TenantId() tenantId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateLocalDto
  ) {
    const Local = await this.localService.UpdateLocal(tenantId, id, dto);
    return Local;
  }

  @Get('counter')
  getSubjectCount(@TenantId() tenantId: string) {
    return this.localService.CountLocals(tenantId);
  }

 
}
