import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ReportCardService } from './report-card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Report Card')
@ApiBearerAuth()
@Controller('report-card')
@UseGuards(JwtAuthGuard)
export class ReportCardController {
  constructor(private readonly reportCardService: ReportCardService) {}

  @Get('batch/:classId')
  @ApiOperation({
    summary: 'Generate report cards for an entire class for a semester',
  })
  @ApiQuery({ name: 'semesterId', required: false, type: Number })
  async getBatchReports(
    @Param('classId') classId: string,
    @Query('semesterId') semesterId: string,
    @Request() req: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.reportCardService.generateBatchReportCards(
      tenantId,
      parseInt(classId),
      semesterId ? parseInt(semesterId) : undefined,
    );
  }

  @Get(':studentId')
  @ApiOperation({
    summary:
      'Generate report card for a student (Semester, Exam, or Full Year)',
  })
  @ApiQuery({ name: 'examId', required: false, type: Number })
  @ApiQuery({ name: 'semesterId', required: false, type: Number })
  async getReport(
    @Param('studentId') studentId: string,
    @Query('examId') examId: string,
    @Query('semesterId') semesterId: string,
    @Request() req: any,
  ) {
    const tenantId = req.user.tenantId;
    return this.reportCardService.generateReportCard(
      tenantId,
      parseInt(studentId),
      examId ? parseInt(examId) : undefined,
      semesterId ? parseInt(semesterId) : undefined,
    );
  }
}
