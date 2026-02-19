import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { SaveStudentAttendanceDto } from './dto/create-student-attendance.dto';
import { UpdateStudentAttendanceDto } from './dto/update-attendance.dto';
import { CreateEmployerAttendanceDto } from './dto/create-employer-attendance.dto';
import { UpdateEmployerAttendanceDto } from './dto/update-employer-attendance.dto';
import { AttendanceStatus } from '@prisma/client';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class AttendanceService {
    constructor(
        private readonly repo: AttendanceRepository,
        private readonly socketGateway: SocketGateway
    ) { }

    // 🧒 Student
    async saves(dto: SaveStudentAttendanceDto) {
        const result = await this.repo.save(dto);
        this.socketGateway.emitRefresh();
        return result;
    }


    async updateStudent(id: number, dto: UpdateStudentAttendanceDto) {
        const result = await this.repo.updateStudent(id, dto);
        this.socketGateway.emitRefresh();
        return result;
    }

    async deleteStudent(id: number) {
        const result = await this.repo.deleteStudent(id);
        this.socketGateway.emitRefresh();
        return result;
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
        const result = await this.repo.createEmployer(dto);
        this.socketGateway.emitRefresh();
        return result;
    }

    async updateEmployer(id: number, dto: UpdateEmployerAttendanceDto) {
        const result = await this.repo.updateEmployer(id, dto);
        this.socketGateway.emitRefresh();
        return result;
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

    async deleteEmployerAttendance(id: number) {
        const result = await this.repo.deleteEmployerAttendance(id);
        this.socketGateway.emitRefresh();
        return result;
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

    async getGlobalWeeklyChartData() {
        return this.repo.getGlobalWeeklyChartData();
    }

    async getGlobalDailySummaryData(date: string) {
        return this.repo.getGlobalDailySummaryData(date);
    }

    getStudentAttendance(studentId: number) {
        return this.repo.getStudentAttendance(studentId);
    }
}
