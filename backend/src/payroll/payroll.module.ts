import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { CompteModule } from 'src/compte/compte.module';
import { HRCalculationService } from './hr-calculation.service';
import { PayrollApprovalService } from './payroll-approval.service';
import { ParameterModule } from '../parameter/parameter.module';

@Module({
  imports: [PrismaModule, CompteModule, ParameterModule],
  controllers: [PayrollController],
  providers: [PayrollService, HRCalculationService, PayrollApprovalService],
  exports: [PayrollService],
})
export class PayrollModule {}
