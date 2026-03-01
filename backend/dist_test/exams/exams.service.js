"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const exam_repository_1 = require("./exam.repository");
const socket_gateway_1 = require("src/socket/socket.gateway");
let ExamService = class ExamService {
    examRepository;
    socketGateway;
    constructor(examRepository, socketGateway) {
        this.examRepository = examRepository;
        this.socketGateway = socketGateway;
    }
    async create(tenantId, createExamDto) {
        // Validate dates
        const startDate = new Date(createExamDto.dateStart);
        const endDate = new Date(createExamDto.dateEnd);
        if (endDate <= startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const exam = await this.examRepository.create(tenantId, createExamDto);
        this.socketGateway.emitRefresh();
        return exam;
    }
    async findAll(tenantId, page = 1, limit = 10, search) {
        const skip = (page - 1) * limit;
        const { exams, total } = await this.examRepository.findAll({
            tenantId,
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
    async findOne(tenantId, id) {
        const exam = await this.examRepository.findOne(tenantId, id);
        if (!exam) {
            throw new common_1.NotFoundException(`Exam with ID ${id} not found`);
        }
        return exam;
    }
    async getExams(tenantId) {
        return this.examRepository.getExams(tenantId);
    }
    async getSubjectOfClass(tenantId, classId, examId) {
        return this.examRepository.getSubjectOfClass(tenantId, classId, examId);
    }
    async saveGrades(tenantId, dto) {
        return this.examRepository.upsertGrades(tenantId, dto.classId, dto.examId, dto.grades);
    }
    async update(tenantId, id, updateExamDto) {
        // Check if exam exists
        await this.findOne(tenantId, id);
        // Validate dates if both are provided
        if (updateExamDto.dateStart && updateExamDto.dateEnd) {
            const startDate = new Date(updateExamDto.dateStart);
            const endDate = new Date(updateExamDto.dateEnd);
            if (endDate <= startDate) {
                throw new common_1.BadRequestException('End date must be after start date');
            }
        }
        const exam = await this.examRepository.update(tenantId, id, updateExamDto);
        this.socketGateway.emitRefresh();
        return exam;
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        await this.examRepository.remove(tenantId, id);
        this.socketGateway.emitRefresh();
        return { message: `Exam with ID ${id} has been deleted` };
    }
    async togglePublish(tenantId, id, publish) {
        await this.findOne(tenantId, id);
        return this.examRepository.togglePublish(tenantId, id, publish);
    }
    async getDashboardStats(tenantId) {
        return this.examRepository.getDashboardStats(tenantId);
    }
    async getSubjectPerformance(tenantId) {
        return this.examRepository.getSubjectPerformance(tenantId);
    }
    async getGradeDistribution(tenantId) {
        return this.examRepository.getGradeDistribution(tenantId);
    }
    async getClassPerformance(tenantId) {
        return this.examRepository.getClassPerformance(tenantId);
    }
    async getStudentGrades(tenantId, studentId) {
        return this.examRepository.getStudentGrades(tenantId, studentId);
    }
    async getTopStudents(tenantId, classId) {
        return this.examRepository.getTopStudents(tenantId, classId);
    }
    async getUpcomingExams(tenantId, classId) {
        return this.examRepository.getUpcomingExams(tenantId, classId);
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [exam_repository_1.ExamRepository, typeof (_a = typeof socket_gateway_1.SocketGateway !== "undefined" && socket_gateway_1.SocketGateway) === "function" ? _a : Object])
], ExamService);
