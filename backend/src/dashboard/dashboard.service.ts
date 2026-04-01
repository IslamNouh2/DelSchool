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
      studentCount,
      teacherCount,
      parentCount,
      staffCount,
      attendanceSummary,
    ] = await Promise.all([
      this.studentService.GetCountStudent(tenantId),
      this.employerService.GetCountTeacher(tenantId),
      this.studentService.GetCountParent(tenantId),
      this.employerService.GetCountStaff(tenantId),
      this.attendanceService.getGlobalDailySummaryData(tenantId, date),
    ]);

    return {
      studentCount,
      teacherCount,
      parentCount,
      staffCount,
      attendanceSummary,
    };
  }
}
