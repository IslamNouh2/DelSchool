import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SubjectLocalService } from './subject-local.service';
import { CreateLocalSubjectBulkDto } from './dto/create-local-subject-bulk.dto';

@Controller('subject-local')
export class SubjectLocalController {
  constructor(private readonly subjectLocalService: SubjectLocalService) {}

  @Post('bulk-insert')
  async bulkInsert(@Body() dto: CreateLocalSubjectBulkDto) {
    return this.subjectLocalService.bulkInsert(dto);
  }


  @Get('/:localId')
  async getSubjectsByLocal(@Param('localId') localId: number) {
    const subjects = await this.subjectLocalService.getSubjectsByLocal(localId);
    return { subjects };
  }

  @Delete(':localId/:subjectId')
  async removeSubjectFromLocal(
    @Param('localId', ParseIntPipe) localId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number
  ) {
    return this.subjectLocalService.removeSubjectFromLocal(localId, subjectId);
  }
}
