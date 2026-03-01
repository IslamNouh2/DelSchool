import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { SubjectLocalService } from './subject-local.service';
import { CreateLocalSubjectBulkDto } from './dto/create-local-subject-bulk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subject-local')
export class SubjectLocalController {
  constructor(private readonly subjectLocalService: SubjectLocalService) {}

  @Post('bulk-insert')
  async bulkInsert(@Req() req: any, @Body() dto: CreateLocalSubjectBulkDto) {
    return this.subjectLocalService.bulkInsert(req.tenantId, dto);
  }


  @Get('/:localId')
  async getSubjectsByLocal(@Req() req: any, @Param('localId') localId: number) {
    const subjects = await this.subjectLocalService.getSubjectsByLocal(req.tenantId, localId);
    return { subjects };
  }

  @Delete(':localId/:subjectId')
  async removeSubjectFromLocal(
    @Req() req: any,
    @Param('localId', ParseIntPipe) localId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number
  ) {
    return this.subjectLocalService.removeSubjectFromLocal(req.tenantId, localId, subjectId);
  }
}
