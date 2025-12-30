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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/dto/register.dto';
import { LocalAuthGuard } from 'src/auth/guards/local-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

//@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectsService: SubjectService) { }

  @Post('createSub')
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }


  @Get('sub-subjects')
  findSubSubjects() {
    return this.subjectsService.findSubSubjects();
  }

  //@Roles(Role.TEACHER, Role.ADMIN)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderByField: string = 'dateCreate',
    @Query('name') name?: string,        // ✅ search by name
    @Query('status') status?: string,    // ✅ filter by active / blocked
  ) {
    return this.subjectsService.findAll(page, limit, orderByField, name, status);
  }
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get('count')
  count(@Req() req) {
    //console.log('Authenticated user:', req.user);
    return this.subjectsService.StubjectCount();
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}
