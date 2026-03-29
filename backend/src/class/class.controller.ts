import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ClassService } from './class.service';
import { CreateClassDto } from './DTO/CreateClass.dto';
import { UpdateClassDto } from './DTO/UpdateClass.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Classes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of classes with pagination and search' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '10' })
  @ApiQuery({ name: 'sort', required: false, example: 'dateCreate' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Returns a list of classes' })
  async getClasses(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sort') sort: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const validSortFields = ['dateCreate', 'code', 'ClassName'];
    const orderByField = validSortFields.includes(sort) ? sort : 'dateCreate';

    return this.classService.GetClasses(
      req.tenantId,
      pageNumber,
      limitNumber,
      orderByField,
      search,
    );
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new class' })
  @ApiResponse({ status: 201, description: 'Class successfully created' })
  async CreateClass(@Req() req: any, @Body() dto: CreateClassDto) {
    const res = await this.classService.CreateClass(req.tenantId, dto);
    return res;
  }

  @Delete(':id')
  async DeleteLocal(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const Delete = await this.classService.DeleteLocal(req.tenantId, id);
    return { message: 'Class deleted successfully' };
  }

  @Put('/:id')
  async UpdateLocals(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassDto,
  ) {
    const classS = await this.classService.UpdateLocal(req.tenantId, id, dto);
    return classS;
  }
}
