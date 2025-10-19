import { Injectable } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { CreateStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';
import { UpdateEmployerAttendanceDto } from './dto/update-employer-attendance.dto';

@Injectable()
export class AttendanceService {
    constructor(private readonly repo: AttendanceRepository) { }

    // 🧒 Student
    createStudent(dto: CreateStudentAttendanceDto) {
        return this.repo.createStudent({
            student: { connect: { studentId: dto.studentId } },
            class: { connect: { classId: dto.classId } },
            checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
            checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
            remarks: dto.remarks ?? null,
            academicYear: dto.academicYear,
        });
    }

    updateStudent(id: number, dto: UpdateStudentAttendanceDto) {
        return this.repo.updateStudent(id, dto);
    }

    getAllStudents() {
        return this.repo.getAllStudents();
    }

    getAllClasses() {
        return this.repo.getAllClasses();
    }
    // ✅ Get students by classId (via Local)
    async getStudentsByClassId(classId: number) {
        return this.repo.getStudentsByClassId(classId);
    }

    // 👩‍🏫 Employer
    createEmployer(dto: CreateEmployerAttendanceDto) {
        return this.repo.createEmployer({
            employer: { connect: { employerId: dto.employerId } },
            checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null,
            checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
            remarks: dto.remarks ?? null,
            academicYear: dto.academicYear,
        });
    }

    updateEmployer(id: number, dto: UpdateEmployerAttendanceDto) {
        return this.repo.updateEmployer(id, dto);
    }

    getAllEmployers() {
        return this.repo.getAllEmployers();
    }
}
