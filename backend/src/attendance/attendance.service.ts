import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { SaveStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';
import { UpdateEmployerAttendanceDto } from './dto/update-employer-attendance.dto';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
    constructor(private readonly repo: AttendanceRepository) { }

    // 🧒 Student
    async saves(dto: SaveStudentAttendanceDto) {
        return this.repo.save(dto);
    }


    updateStudent(id: number, dto: UpdateStudentAttendanceDto) {
        return this.repo.updateStudent(id, dto);
    }

    deleteStudent(id: number) {
        return this.repo.deleteStudent(id);
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

    // Get existing attendance by date and classId
    async getExistingAttendance(classId: number, date: string) {
        return this.repo.getExistingAttendance(classId, date);
    }

    // 👩‍🏫 Employer
    async createEmployer(dto: CreateEmployerAttendanceDto) {
        return await this.repo.createEmployer(dto);
    }

    updateEmployer(id: number, dto: UpdateEmployerAttendanceDto) {
        return this.repo.updateEmployer(id, dto);
    }

    getAllEmployers() {
        return this.repo.getAllEmployers();
    }

    getAllEmployerBasics() {
        return this.repo.getAllEmployerBasics();
    }

    getExistingEmployerAttendance(date: string) {
        return this.repo.getExistingEmployerAttendance(date);
    }

    deleteEmployerAttendance(id: number) {
        return this.repo.deleteEmployerAttendance(id);
    }

    getStudentLast7DaysAttendance(classId: number) {
        return this.repo.getStudentLast7DaysAttendance(classId);
    }

    getEmployerLast7DaysAttendance() {
        return this.repo.getEmployerLast7DaysAttendance();
    }
    getStudentWeeklyChartData(classId: number) {
        return this.repo.getStudentWeeklyChartData(classId);
    }

    getStudentDailySummaryData(classId: number, date: string) {
        return this.repo.getStudentDailySummaryData(classId, date);
    }

    getStudentAttendance(studentId: number) {
        return this.repo.getStudentAttendance(studentId);
    }
}
