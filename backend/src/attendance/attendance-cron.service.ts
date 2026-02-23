import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Automatically creates ABSENT records for employees who haven't checked in by the end of the day.
   * Runs every day at 20:00 (8 PM).
   */
  @Cron('0 20 * * *')
  async autoMarkAbsent() {
    this.logger.log('Starting Auto-Absence Cron job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Get all active employers
    const employers = await this.prisma.employer.findMany({
      where: { okBlock: false },
    });

    // 2. Identify who is missing attendance for today
    for (const emp of employers) {
      const attendance = await this.prisma.employerAttendance.findUnique({
        where: {
          employerId_date_academicYear: {
            employerId: emp.employerId,
            date: today,
            academicYear: '2024-2025', // Should ideally come from a settings/parameter service
          },
        },
      });

      if (!attendance) {
        // 3. Create ABSENT record
        await this.prisma.employerAttendance.create({
          data: {
            employerId: emp.employerId,
            date: today,
            status: AttendanceStatus.ABSENT,
            academicYear: '2024-2025',
            remarks: 'Auto-marked absent by system cron',
          },
        });
        this.logger.log(`Marked Employer ${emp.employerId} as ABSENT for ${today.toDateString()}`);
      }
    }

    this.logger.log('Auto-Absence Cron job completed.');
  }
}
