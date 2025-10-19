import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from "@nestjs/common";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { TimetableService } from "./timetable.service";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";

@Controller('timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) { }

  @Post()
  async create(@Body() dto: CreateTimetableDto) {
    return this.service.create(dto);
  }


  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get('class/:id')
  getByClass(@Param('id') id: number) {
    return this.service.getByClass(+id);
  }

  @Get('teacher/:id')
  getByTeacher(@Param('id') id: number) {
    return this.service.getByTeacher(+id);
  }

  @Get('student/:id')
  getByStudent(@Param('id') id: number) {
    return this.service.getByStudent(+id);
  }

  @Get('check')
  async checkDuplicate(
    @Query('day') day: string,
    @Query('classId', ParseIntPipe) classId: number,
    @Query('timeSlotId', ParseIntPipe) timeSlotId: number,
    @Query('academicYear') academicYear: string,
  ) {
    return this.service.checkDuplicate(day, classId, timeSlotId, academicYear);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() dto: UpdateTimetableDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }
}
