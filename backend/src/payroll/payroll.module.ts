import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { CompteModule } from 'src/compte/compte.module';

@Module({
  imports: [PrismaModule, CompteModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
