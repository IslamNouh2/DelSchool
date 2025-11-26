import { Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { SaveStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';

@Injectable()
export class AttendanceRepository {
    constructor(private prisma: PrismaService) { }

    // 🧒 Student Attendance
    async save(dto: SaveStudentAttendanceDto) {
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
            })),
            skipDuplicates: true,
        });
    }

    updateStudent(id: number, data: Prisma.StudentAttendanceUpdateInput) {
        return this.prisma.studentAttendance.update({ where: { id }, data });
    }

    deleteStudent(id: number) {
        return this.prisma.studentAttendance.delete({ where: { id } });
    }

    getAllStudents() {
        return this.prisma.studentAttendance.findMany({
            include: { student: true, class: true },
        });
    }

    // ✅ Get students by classId (now using StudentClass)
    async getStudentsByClassId(classId: number) {
        return this.prisma.student.findMany({
            where: {
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

    async getAllClasses() {
        return this.prisma.classes.findMany({
            select: {
                classId: true,
                ClassName: true,
            },
            orderBy: { ClassName: 'asc' },
        });
    }

    // Get existing attendance by date and classId
    async getExistingAttendance(classId: number, date: string) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.studentAttendance.findMany({
            where: {
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
    createEmployer(dto: CreateEmployerAttendanceDto) {
        return this.prisma.employerAttendance.create({
            data: {
                employerId: dto.employerId,
                date: new Date(dto.date),
                checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
                checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
                status: dto.status,
                remarks: dto.remarks || null,
                academicYear: dto.academicYear,
            },
        });
    }

    updateEmployer(id: number, data: Prisma.EmployerAttendanceUpdateInput) {
        return this.prisma.employerAttendance.update({ where: { id }, data });
    }

    getAllEmployers() {
        return this.prisma.employerAttendance.findMany({
            include: { employer: true },
        });
    }

    // Basic employers list to take attendance
    getAllEmployerBasics() {
        return this.prisma.employer.findMany({
            select: {
                employerId: true,
                firstName: true,
                lastName: true,
                code: true,
            },
            orderBy: { lastName: 'asc' },
        });
    }

    // Existing employer attendance by date
    async getExistingEmployerAttendance(date: string) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.employerAttendance.findMany({
            where: {
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

    deleteEmployerAttendance(id: number) {
        return this.prisma.employerAttendance.delete({ where: { id } });
    }

    // ✅ Get last 7 days attendance for students (using StudentClass)
    async getStudentLast7DaysAttendance(classId: number) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Get all students in this class
        const allStudents = await this.prisma.student.findMany({
            where: {
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
    async getEmployerLast7DaysAttendance() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const allEmployers = await this.prisma.employer.findMany({
            select: {
                employerId: true,
                firstName: true,
                lastName: true,
                code: true,
            },
            orderBy: { lastName: 'asc' },
        });

        const attendanceRecords = await this.prisma.employerAttendance.findMany({
            where: { date: { gte: sevenDaysAgo } },
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
}
