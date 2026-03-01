import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(@Query() query: { skip?: string; take?: string; search?: string }) {
    return this.usersService.findAll({
      skip: query.skip ? +query.skip : undefined,
      take: query.take ? +query.take : undefined,
      search: query.search,
    });
  }

  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(+id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(+id);
  }
}
