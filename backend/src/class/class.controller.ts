import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Delete, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './DTO/CreateClass.dto';
import { UpdateClassDto } from './DTO/UpdateClass.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/dto/register.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) { }

  @Get()
  async getClasses(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sort') sort: string
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const validSortFields = ['dateCreate', 'code', 'ClassName']
    const orderByField = validSortFields.includes(sort) ? sort : 'dateCreate'

    return this.classService.GetClasses(pageNumber, limitNumber, orderByField);
  }

  @Post('create')
  async CreateLocal(@Body() dto: CreateClassDto) {
    const res = await this.classService.CreateClass(dto);
    return res;
  }


  @Delete(':id')
  async DeleteLocal(
    @Param('id', ParseIntPipe) id: number
  ) {

    const Delete = await this.classService.DeleteLocal(id);
    return { message: 'Class deleted successfully' };
  }


  @Put('/:id')
  async UpdateLocals(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto
  ) {
    const classS = await this.classService.UpdateLocal(id, dto);
    return classS;
  }
}
