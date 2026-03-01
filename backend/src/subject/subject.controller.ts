// src/subjects/subjects.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectsService: SubjectService) { }

  @Post('createSub')
  create(@Req() req: any, @Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(req.tenantId, createSubjectDto);
  }


  @Get('sub-subjects')
  findSubSubjects(@Req() req: any) {
    return this.subjectsService.findSubSubjects(req.tenantId);
  }

  //@Roles('TEACHER', 'ADMIN')
  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderByField: string = 'dateCreate',
    @Query('name') name?: string,        // ✅ search by name
    @Query('status') status?: string,    // ✅ filter by active / blocked
  ) {
    return this.subjectsService.findAll(req.tenantId, page, limit, orderByField, name, status);
  }
  @Roles('TEACHER', 'ADMIN')
  @Get('count')
  count(@Req() req: any) {
    //console.log('Authenticated user:', req.user);
    return this.subjectsService.StubjectCount(req.tenantId);
  }

  @Roles('TEACHER', 'ADMIN')
  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(req.tenantId, id);
  }

  @Roles('TEACHER', 'ADMIN')
  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(req.tenantId, id, updateSubjectDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(req.tenantId, id);
  }
}
