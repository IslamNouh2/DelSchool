import { Controller, Get, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantId } from 'src/auth/decorators/tenant-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parent')
export class ParentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('count')
  async getCount(@TenantId() tenantId: string) {
    return this.studentService.getParentCount(tenantId);
  }
}
