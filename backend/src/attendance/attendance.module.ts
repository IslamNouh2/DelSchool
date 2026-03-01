import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';

import { AttendanceCronService } from './attendance-cron.service';

import { ParameterModule } from '../parameter/parameter.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ParameterModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService, AttendanceRepository, AttendanceCronService],
  exports:[AttendanceService]
})
export class AttendanceModule {}
