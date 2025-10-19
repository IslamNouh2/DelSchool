import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AttendanceRepository {
    constructor(private prisma: PrismaService) { }

    // 🧒 Student Attendance
    createStudent(data: Prisma.StudentAttendanceCreateInput) {
        return this.prisma.studentAttendance.create({ data });
    }

    updateStudent(id: number, data: Prisma.StudentAttendanceUpdateInput) {
        return this.prisma.studentAttendance.update({ where: { id }, data });
    }

    getAllStudents() {
        return this.prisma.studentAttendance.findMany({
            include: { student: true, class: true },
        });
    }

    // ✅ Get students by classId (via Local)
    async getStudentsByClassId(classId: number) {
        const classData = await this.prisma.classes.findUnique({
            where: { classId },
            select: { localId: true },
        });

        if (!classData) return [];

        return this.prisma.student.findMany({
            where: {
                studentLocals: {
                    some: {
                        localId: classData.localId,
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

    // 👩‍🏫 Employer Attendance
    createEmployer(data: Prisma.EmployerAttendanceCreateInput) {
        return this.prisma.employerAttendance.create({ data });
    }

    updateEmployer(id: number, data: Prisma.EmployerAttendanceUpdateInput) {
        return this.prisma.employerAttendance.update({ where: { id }, data });
    }

    getAllEmployers() {
        return this.prisma.employerAttendance.findMany({
            include: { employer: true },
        });
    }
}