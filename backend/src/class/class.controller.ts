import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Delete, UseGuards, Req } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './DTO/CreateClass.dto';
import { UpdateClassDto } from './DTO/UpdateClass.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) { }
  
  @Get()
  async getClasses(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sort') sort: string,
    @Query('search') search?: string
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const validSortFields = ['dateCreate', 'code', 'ClassName']
    const orderByField = validSortFields.includes(sort) ? sort : 'dateCreate'

    return this.classService.GetClasses(req.tenantId, pageNumber, limitNumber, orderByField, search);
  }

  @Post('create')
  async CreateClass(@Req() req: any, @Body() dto: CreateClassDto) {
    const res = await this.classService.CreateClass(req.tenantId, dto);
    return res;
  }


  @Delete(':id')
  async DeleteLocal(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number
  ) {

    const Delete = await this.classService.DeleteLocal(req.tenantId, id);
    return { message: 'Class deleted successfully' };
  }


  @Put('/:id')
  async UpdateLocals(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto
  ) {
    const classS = await this.classService.UpdateLocal(req.tenantId, id, dto);
    return classS;
  }
}
