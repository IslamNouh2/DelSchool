import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExamRepository } from './exam.repository';
import { SocketGateway } from 'src/socket/socket.gateway';

import { Exam } from '@prisma/client';
import { CreateExamDto } from './DTO/create-exam.dto';
import { UpdateExamDto } from './DTO/update-exam.dto';
import { UpsertGradesDto } from './DTO/upsert-grades.dto';
@Injectable()
export class ExamService {
    constructor(
        private readonly examRepository: ExamRepository,
        private socketGateway: SocketGateway
    ) { }


    async create(createExamDto: CreateExamDto): Promise<Exam> {
        // Validate dates
        const startDate = new Date(createExamDto.dateStart);
        const endDate = new Date(createExamDto.dateEnd);

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }

        const exam = await this.examRepository.create(createExamDto);
        this.socketGateway.emitRefresh();
        return exam;
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        search?: string,
    ): Promise<{ exams: Exam[]; total: number; page: number; totalPages: number }> {
        const skip = (page - 1) * limit;
        const { exams, total } = await this.examRepository.findAll({
            skip,
            take: limit,
            search,
        });

        return {
            exams,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number): Promise<Exam> {
        const exam = await this.examRepository.findOne(id);
        if (!exam) {
            throw new NotFoundException(`Exam with ID ${id} not found`);
        }
        return exam;
    }

    async getExams() {
        return this.examRepository.getExams();
    }

    async getSubjectOfClass(classId: number, examId: number) {
        return this.examRepository.getSubjectOfClass(classId, examId);
    }

    async saveGrades(dto: UpsertGradesDto) {
        return this.examRepository.upsertGrades(dto.classId, dto.examId, dto.grades);
    }

    async update(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
        // Check if exam exists
        await this.findOne(id);

        // Validate dates if both are provided
        if (updateExamDto.dateStart && updateExamDto.dateEnd) {
            const startDate = new Date(updateExamDto.dateStart);
            const endDate = new Date(updateExamDto.dateEnd);

            if (endDate <= startDate) {
                throw new BadRequestException('End date must be after start date');
            }
        }

        const exam = await this.examRepository.update(id, updateExamDto);
        this.socketGateway.emitRefresh();
        return exam;
    }

    async remove(id: number): Promise<{ message: string }> {
        await this.findOne(id);
        await this.examRepository.remove(id);
        this.socketGateway.emitRefresh();
        return { message: `Exam with ID ${id} has been deleted` };
    }

    async togglePublish(id: number, publish: boolean): Promise<Exam> {
        await this.findOne(id);
        return this.examRepository.togglePublish(id, publish);
    }

    async getDashboardStats() {
        return this.examRepository.getDashboardStats();
    }

    async getSubjectPerformance() {
        return this.examRepository.getSubjectPerformance();
    }

    async getGradeDistribution() {
        return this.examRepository.getGradeDistribution();
    }

    async getClassPerformance() {
        return this.examRepository.getClassPerformance();
    }

    async getStudentGrades(studentId: number) {
        return this.examRepository.getStudentGrades(studentId);
    }
}
