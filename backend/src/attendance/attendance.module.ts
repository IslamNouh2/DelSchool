import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PrismaService } from 'prisma/prisma.service';
import { AttendanceRepository } from './attendance.repository';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService, AttendanceRepository],
  exports:[AttendanceService]
})
export class AttendanceModule {}
