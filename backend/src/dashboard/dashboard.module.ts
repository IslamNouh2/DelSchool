import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { StudentModule } from '../student/student.module';
import { EmployerModule } from '../teacher/employer.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [StudentModule, EmployerModule, AttendanceModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
