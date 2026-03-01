import { Controller, Get } from '@nestjs/common';
import { StudentService } from './student.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Req, UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parent')
export class ParentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('count')
  async getCount(@Req() req: any) {
    return this.studentService.GetCountParent(req.tenantId);
  }
}
