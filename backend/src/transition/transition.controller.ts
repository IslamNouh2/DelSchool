import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TransitionService } from './transition.service';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transition')
@UseGuards(JwtAuthGuard)
export class TransitionController {
  constructor(private readonly transitionService: TransitionService) {}

  @Get('passing-students')
  getPassingStudents(
    @TenantId() tenantId: string,
    @Query('classId', ParseIntPipe) classId: number,
  ) {
    return this.transitionService.getPassingStudents(tenantId, classId);
  }

  @Post('process')
  transitionStudents(
    @TenantId() tenantId: string,
    @Body()
    dto: {
      nextYear: string;
      transitions: {
        studentId: number;
        studentClassId: number;
        nextClassId: number;
      }[];
    },
  ) {
    return this.transitionService.transitionStudents(tenantId, dto);
  }
}
