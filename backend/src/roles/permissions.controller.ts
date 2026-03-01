import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  async create(@Body() data: { name: string; description?: string }) {
    return this.permissionsService.create(data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.permissionsService.delete(+id);
  }
}
