import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';

@Injectable()
export class AttendanceRepository {
  constructor(private prisma: PrismaService) {}

  // 🧒 Student Attendance
  async save(tenantId: string, dto: SaveStudentAttendanceDto) {
    const { classId, date, academicYear, records } = dto;

    // filter out "PRESENT" before saving
    const toInsert = records.filter((r) => r.status !== 'PRESENT');

    if (toInsert.length === 0) return { message: 'No records to save.' };

    return this.prisma.studentAttendance.createMany({
      data: toInsert.map((r) => ({
        studentId: r.studentId,
        classId,
        date: new Date(date),
        academicYear,
        status: r.status,
        tenantId, // Add tenantId
      })),
      skipDuplicates: true,
    });
  }

  updateStudent(
    tenantId: string,
    id: number,
    data: Prisma.StudentAttendanceUpdateInput,
  ) {
    return this.prisma.studentAttendance.update({
      where: { id, tenantId }, // Enforce tenant check
      data,
    });
  }

  deleteStudent(tenantId: string, id: number) {
    return this.prisma.studentAttendance.delete({
      where: { id, tenantId },
    });
  }

  getAllStudents(tenantId: string) {
    return this.prisma.studentAttendance.findMany({
      where: { tenantId },
      include: { student: true, class: true },
    });
  }

  // ✅ Get students by classId (now using StudentClass)
  async getStudentsByClassId(tenantId: string, classId: number) {
    return this.prisma.student.findMany({
      where: {
        tenantId, // Enforce tenant
        studentClasses: {
          some: {
            classId,
          },
        },
      },
      select: {
        studentId: true,
        firstName: true,
        lastName: true,
        code: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async getAllClasses(tenantId: string) {
    return this.prisma.classes.findMany({
      where: { tenantId },
      select: {
        classId: true,
        ClassName: true,
      },
      orderBy: { ClassName: 'asc' },
    });
  }

  // Get existing attendance by date and classId
  async getExistingAttendance(tenantId: string, classId: number, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.studentAttendance.findMany({
      where: {
        tenantId,
        classId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        studentId: true,
        status: true,
      },
    });
  }

  // 👩‍🏫 Employer Attendance
  createEmployer(tenantId: string, dto: CreateEmployerAttendanceDto) {
    return this.prisma.employerAttendance.create({
      data: {
        employerId: dto.employerId,
        date: new Date(dto.date),
        checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        status: dto.status,
        remarks: dto.remarks || null,
        academicYear: dto.academicYear,
        tenantId,
      },
    });
  }

  updateEmployer(
    tenantId: string,
    id: number,
    data: Prisma.EmployerAttendanceUpdateInput,
  ) {
    return this.prisma.employerAttendance.update({
      where: { id, tenantId },
      data,
    });
  }

  getAllEmployers(tenantId: string) {
    return this.prisma.employerAttendance.findMany({
      where: { tenantId },
      include: { employer: true },
    });
  }

  getEmployerAttendanceById(tenantId: string, id: number) {
    return this.prisma.employerAttendance.findUnique({
      where: { id, tenantId },
    });
  }

  getEmployerConfig(tenantId: string, employerId: number) {
    return this.prisma.employer.findUnique({
      where: { employerId, tenantId },
      select: {
        checkInTime: true,
        checkOutTime: true,
      },
    });
  }

  // Basic employers list to take attendance
  getAllEmployerBasics(tenantId: string) {
    return this.prisma.employer.findMany({
      where: { tenantId },
      select: {
        employerId: true,
        firstName: true,
        lastName: true,
        code: true,
        checkInTime: true,
        checkOutTime: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  // Existing employer attendance by date
  async getExistingEmployerAttendance(tenantId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.employerAttendance.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        employerId: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
        remarks: true,
      },
    });
  }

  deleteEmployerAttendance(tenantId: string, id: number) {
    return this.prisma.employerAttendance.delete({
      where: { id, tenantId },
    });
  }

  // ✅ Get last 7 days attendance for students (using StudentClass)
  async getStudentLast7DaysAttendance(tenantId: string, classId: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get all students in this class
    const allStudents = await this.prisma.student.findMany({
      where: {
        tenantId,
        studentClasses: {
          some: { classId },
        },
      },
      select: {
        studentId: true,
        firstName: true,
        lastName: true,
        code: true,
      },
      orderBy: { lastName: 'asc' },
    });

    // Get attendance for the last 7 days
    const attendanceRecords = await this.prisma.studentAttendance.findMany({
      where: {
        tenantId,
        classId,
        date: { gte: sevenDaysAgo },
      },
      include: {
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Combine
    return allStudents.map((student) => ({
      student,
      attendanceRecords: attendanceRecords.filter(
        (record) => record.studentId === student.studentId,
      ),
    }));
  }

  // Get last 7 days attendance for employers
  async getEmployerLast7DaysAttendance(tenantId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const allEmployers = await this.prisma.employer.findMany({
      where: { tenantId },
      select: {
        employerId: true,
        firstName: true,
        lastName: true,
        code: true,
      },
      orderBy: { lastName: 'asc' },
    });

    const attendanceRecords = await this.prisma.employerAttendance.findMany({
      where: {
        tenantId,
        date: { gte: sevenDaysAgo },
      },
      include: {
        employer: {
          select: {
            employerId: true,
            firstName: true,
            lastName: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return allEmployers.map((employer) => ({
      employer,
      attendanceRecords: attendanceRecords.filter(
        (record) => record.employerId === employer.employerId,
      ),
    }));
  }
  async getStudentWeeklyChartData(tenantId: string, classId: number) {
    const result: { day: string; present: number; absent: number }[] = [];
    const today = new Date();

    // Get total students in this class
    const totalStudents = await this.prisma.studentClass.count({
      where: {
        classId,
        isCurrent: true,
        Student: { tenantId }, // Enforce tenant (Case sensitive: Student)
      },
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const records = await this.prisma.studentAttendance.findMany({
        where: {
          tenantId,
          classId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true },
      });

      const nonPresentCount = records.length; // Everyone in DB is not PRESENT
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const present = Math.max(0, totalStudents - nonPresentCount);

      const dayName = startOfDay.toLocaleDateString('en-US', {
        weekday: 'short',
      });

      result.push({
        day: dayName,
        present,
        absent,
      });
    }
    return result;
  }

  async getGlobalWeeklyChartData(tenantId: string) {
    const result: { day: string; present: number; absent: number }[] = [];
    const today = new Date();

    // Get total students
    const totalStudents = await this.prisma.student.count({
      where: { tenantId },
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const records = await this.prisma.studentAttendance.findMany({
        where: {
          tenantId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true },
      });

      const nonPresentCount = records.length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const present = Math.max(0, totalStudents - nonPresentCount);

      const dayName = startOfDay.toLocaleDateString('en-US', {
        weekday: 'short',
      });

      result.push({
        day: dayName,
        present,
        absent,
      });
    }
    return result;
  }

  async getGlobalDailySummaryData(tenantId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const [records, totalStudents] = await Promise.all([
      this.prisma.studentAttendance.findMany({
        where: {
          tenantId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true },
      }),
      this.prisma.student.count({ where: { tenantId } }),
    ]);

    const nonPresentCount = records.length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const present = Math.max(0, totalStudents - nonPresentCount);

    return [
      { name: 'Present', value: present, color: '#0052cc' },
      { name: 'Absent', value: absent, color: '#bf95f9' },
      { name: 'Late', value: late, color: '#f59e0b' },
    ];
  }

  // Chart Data: Daily Summary
  async getStudentDailySummaryData(
    tenantId: string,
    classId: number,
    date: string,
  ) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const [records, totalStudents] = await Promise.all([
      this.prisma.studentAttendance.findMany({
        where: {
          tenantId,
          classId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true },
      }),
      this.prisma.studentClass.count({
        where: {
          classId,
          isCurrent: true,
          Student: { tenantId }, // Enforce tenant (Case sensitive: Student)
        },
      }),
    ]);

    const nonPresentCount = records.length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const present = Math.max(0, totalStudents - nonPresentCount);

    return [
      { name: 'Present', value: present, color: '#0052cc' },
      { name: 'Absent', value: absent, color: '#bf95f9' },
      { name: 'Late', value: late, color: '#f59e0b' },
    ];
  }

  async getStudentAttendance(tenantId: string, studentId: number) {
    return this.prisma.studentAttendance.findMany({
      where: { studentId, tenantId },
      orderBy: { date: 'desc' },
    });
  }

  async getEmployerWeeklyChartData(tenantId: string) {
    const result: { day: string; present: number; absent: number }[] = [];
    const today = new Date();

    const totalEmployers = await this.prisma.employer.count({
      where: {
        tenantId,
        type: { not: 'teacher' },
      },
    });

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const records = await this.prisma.employerAttendance.findMany({
        where: {
          tenantId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
          employer: {
            type: { not: 'teacher' },
          },
        },
        select: { status: true },
      });

      const nonPresentCount = records.length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const present = Math.max(0, totalEmployers - nonPresentCount);

      const dayName = startOfDay.toLocaleDateString('en-US', {
        weekday: 'short',
      });

      result.push({
        day: dayName,
        present,
        absent,
      });
    }
    return result;
  }

  async getEmployerDailySummaryData(tenantId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const [records, totalEmployers] = await Promise.all([
      this.prisma.employerAttendance.findMany({
        where: {
          tenantId,
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: { status: true },
      }),
      this.prisma.employer.count({ where: { tenantId } }),
    ]);

    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const explicitlyPresent = records.filter(
      (r) => r.status === 'PRESENT',
    ).length;
    const present = Math.max(
      0,
      totalEmployers - records.length + explicitlyPresent,
    );

    return [
      { name: 'Present', value: present, color: '#0052cc' },
      { name: 'Absent', value: absent, color: '#ef4444' },
      { name: 'Late', value: late, color: '#f59e0b' },
    ];
  }

  async getEmployerAttendanceByEmployerId(
    tenantId: string,
    employerId: number,
  ) {
    return this.prisma.employerAttendance.findMany({
      where: { employerId, tenantId },
      orderBy: { date: 'desc' },
    });
  }
}
