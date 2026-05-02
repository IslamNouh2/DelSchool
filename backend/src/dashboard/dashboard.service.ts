import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { EmployerService } from '../teacher/employer.service';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly studentService: StudentService,
    private readonly employerService: EmployerService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async getStats(tenantId: string, date: string) {
    const [
      studentStats,
      teacherCount,
      parentCount,
      staffCount,
      attendanceSummary,
    ] = await Promise.all([
      this.studentService.getStudentStats(tenantId),
      this.employerService.getCountTeacher(tenantId),
      this.studentService.getParentCount(tenantId),
      this.employerService.getCountStaff(tenantId),
      this.attendanceService.getGlobalDailySummaryData(tenantId, date),
    ]);

    return {
      studentCount: studentStats.total,
      studentStats,
      teacherCount,
      parentCount,
      staffCount,
      attendanceSummary,
    };
  }
}
