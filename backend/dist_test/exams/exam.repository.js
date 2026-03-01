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
exports.ExamRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
let ExamRepository = class ExamRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, data) {
        return this.prisma.exam.create({
            data: {
                examName: data.examName,
                dateStart: new Date(data.dateStart),
                dateEnd: new Date(data.dateEnd),
                publish: data.publish ?? false,
                dateCreate: new Date(),
                dateModif: new Date(),
                tenantId, // Enforce tenant
            },
        });
    }
    async findAll(params) {
        const { tenantId, skip = 0, take = 10, search } = params;
        const where = {
            tenantId, // Enforce tenant
        };
        if (search) {
            where.examName = {
                contains: search,
                mode: 'insensitive',
            };
        }
        const [exams, total] = await Promise.all([
            this.prisma.exam.findMany({
                where,
                skip,
                take,
                orderBy: { dateCreate: 'desc' },
            }),
            this.prisma.exam.count({ where }),
        ]);
        return { exams, total };
    }
    async findOne(tenantId, id) {
        return this.prisma.exam.findFirst({
            where: { id, tenantId },
        });
    }
    async getExams(tenantId) {
        return this.prisma.exam.findMany({
            where: { tenantId },
            select: {
                id: true,
                examName: true,
            },
        });
    }
    /**
      * Get all subjects for a class with student grades
      */
    async getSubjectOfClass(tenantId, classId, examId) {
        // Get class's local
        const classData = await this.prisma.classes.findFirst({
            where: { classId, tenantId },
            select: { localId: true },
        });
        if (!classData) {
            throw new Error('Class not found');
        }
        // Get all subjects linked to this class
        const classSubjects = await this.prisma.subject.findMany({
            where: {
                tenantId,
                subject_local: {
                    some: {
                        localId: classData.localId,
                        tenantId,
                    },
                },
            },
            select: {
                subjectId: true,
                subjectName: true,
                totalGrads: true,
            },
        });
        // Get all students with their existing grades for that exam
        const students = await this.prisma.student.findMany({
            where: {
                tenantId,
                studentClasses: {
                    some: {
                        classId,
                        isCurrent: true, // Only current enrollment
                    },
                },
            },
            select: {
                studentId: true,
                firstName: true,
                lastName: true,
                code: true,
                studentClasses: {
                    where: {
                        classId,
                        isCurrent: true,
                    },
                    select: {
                        id: true, // studentClassId needed for insert/update
                        grads: {
                            where: { examId, tenantId },
                            select: {
                                id: true,
                                subjectId: true,
                                grads: true,
                            },
                        },
                    },
                },
            },
        });
        // Merge subjects and grades
        const result = students.map((student) => {
            const studentClass = student.studentClasses[0];
            const grads = studentClass?.grads || [];
            const subjects = classSubjects.map((subj) => {
                const found = grads.find((g) => g.subjectId === subj.subjectId);
                return {
                    subjectId: subj.subjectId,
                    subjectName: subj.subjectName,
                    totalGrads: subj.totalGrads,
                    gradeId: found?.id || null, // For update reference
                    grade: found?.grads || 0, // Default to 0 if missing
                };
            });
            return {
                studentId: student.studentId,
                studentClassId: studentClass?.id,
                studentCode: student.code,
                studentName: `${student.firstName} ${student.lastName}`,
                subjects,
            };
        });
        return result;
    }
    async upsertGrades(tenantId, classId, examId, grades) {
        console.log(`[UpsertGrades] Starting for Class: ${classId}, Exam: ${examId}, Count: ${grades.length}`);
        if (!Array.isArray(grades)) {
            throw new common_1.BadRequestException('grades must be an array');
        }
        const results = [];
        for (const entry of grades) {
            const { studentId, subjectId, grade } = entry;
            console.log(`[UpsertGrades] Processing Student: ${studentId}, Subject: ${subjectId}, Grade: ${grade}`);
            const studentClass = await this.prisma.studentClass.findFirst({
                where: { studentId, classId },
                select: { id: true },
            });
            if (!studentClass) {
                console.warn(`[UpsertGrades] StudentClass not found for Student: ${studentId}, Class: ${classId}`);
                continue;
            }
            console.log(`[UpsertGrades] Found StudentClass ID: ${studentClass.id}`);
            try {
                const grad = await this.prisma.grads.upsert({
                    where: {
                        examId_studentClassId_subjectId: {
                            examId,
                            studentClassId: studentClass.id,
                            subjectId,
                        },
                    },
                    // We don't include tenantId in unique lookup key for upsert usually, 
                    // unless it's part of the @unique constraint. 
                    // Our @unique([examId, studentClassId, subjectId]) doesn't include tenantId.
                    // However, we should verify the record exists or use create which includes it.
                    // Prisma upsert where doesn't allow tenantId if not in unique. 
                    // We'll use findFirst + create/update for safety.
                    update: {
                        grads: grade,
                        dateModif: new Date(),
                    },
                    create: {
                        examId,
                        studentClassId: studentClass.id,
                        subjectId,
                        grads: grade,
                        dateCreate: new Date(),
                        tenantId, // Enforce tenant
                    },
                });
                console.log(`[UpsertGrades] Upsert success for Grade ID: ${grad.id}`);
                results.push(grad);
            }
            catch (error) {
                console.error(`[UpsertGrades] Error upserting grade:`, error);
            }
        }
        return results;
    }
    async update(tenantId, id, data) {
        const updateData = {
            dateModif: new Date(),
        };
        if (data.examName !== undefined)
            updateData.examName = data.examName;
        if (data.dateStart !== undefined)
            updateData.dateStart = new Date(data.dateStart);
        if (data.dateEnd !== undefined)
            updateData.dateEnd = new Date(data.dateEnd);
        if (data.publish !== undefined)
            updateData.publish = data.publish;
        return this.prisma.exam.update({
            where: { id }, // id is unique globally
            data: updateData,
        });
    }
    async remove(tenantId, id) {
        // findFirst/findOne already checked existence/tenant in service
        return this.prisma.exam.delete({
            where: { id },
        });
    }
    async togglePublish(tenantId, id, publish) {
        return this.prisma.exam.update({
            where: { id },
            data: {
                publish,
                dateModif: new Date(),
            },
        });
    }
    async getDashboardStats(tenantId) {
        const [totalGrades, studentsCount, examsCount] = await Promise.all([
            this.prisma.grads.aggregate({
                where: { tenantId },
                _avg: { grads: true },
                _count: { id: true },
            }),
            this.prisma.student.count({ where: { tenantId } }),
            this.prisma.exam.count({ where: { tenantId } }),
        ]);
        const passingGrades = await this.prisma.grads.count({
            where: { grads: { gte: 50 }, tenantId },
        });
        const passRate = totalGrades._count.id > 0
            ? (passingGrades / totalGrades._count.id) * 100
            : 0;
        return {
            averageGrade: totalGrades._avg.grads || 0,
            totalStudents: studentsCount,
            examsCount,
            passRate,
        };
    }
    async getSubjectPerformance(tenantId) {
        const subjects = await this.prisma.subject.findMany({
            where: { tenantId },
            include: {
                grads: {
                    where: { tenantId },
                    select: { grads: true },
                },
            },
        });
        return subjects.map(s => {
            const avg = s.grads.length > 0
                ? s.grads.reduce((acc, curr) => acc + curr.grads, 0) / s.grads.length
                : 0;
            const passing = s.grads.filter(g => g.grads >= 50).length;
            const passRate = s.grads.length > 0 ? (passing / s.grads.length) * 100 : 0;
            return {
                subject: s.subjectName,
                average: avg,
                passing: passRate,
            };
        });
    }
    async getClassPerformance(tenantId) {
        const classesData = await this.prisma.classes.findMany({
            where: { tenantId },
            include: {
                studentClasses: {
                    where: {},
                    include: {
                        grads: {
                            where: { tenantId },
                            select: { grads: true },
                        },
                    },
                },
            },
        });
        return classesData.map(c => {
            const allGrads = c.studentClasses.flatMap((sc) => sc.grads.map((g) => g.grads));
            const avg = allGrads.length > 0
                ? allGrads.reduce((acc, curr) => acc + curr, 0) / allGrads.length
                : 0;
            return {
                className: c.ClassName,
                average: parseFloat(avg.toFixed(2)),
            };
        });
    }
    async getGradeDistribution(tenantId) {
        const grades = await this.prisma.grads.findMany({
            where: { tenantId },
            select: { grads: true },
        });
        const distribution = [
            { grade: 'A+', min: 95, count: 0 },
            { grade: 'A', min: 90, count: 0 },
            { grade: 'B+', min: 85, count: 0 },
            { grade: 'B', min: 80, count: 0 },
            { grade: 'C+', min: 75, count: 0 },
            { grade: 'C', min: 70, count: 0 },
            { grade: 'D', min: 60, count: 0 },
            { grade: 'F', min: 0, count: 0 },
        ];
        grades.forEach(g => {
            for (const d of distribution) {
                if (g.grads >= d.min) {
                    d.count++;
                    break;
                }
            }
        });
        return distribution.map(({ grade, count }) => ({ grade, count }));
    }
    async getStudentGrades(tenantId, studentId) {
        return this.prisma.grads.findMany({
            where: {
                tenantId,
                studentClass: {
                    studentId: studentId,
                }
            },
            include: {
                subject: true,
                exam: true
            },
            orderBy: {
                exam: {
                    dateStart: 'desc'
                }
            }
        });
    }
    async getTopStudents(tenantId, classId) {
        const where = { tenantId };
        if (classId) {
            where.studentClass = { classId };
        }
        const studentGrades = await this.prisma.grads.findMany({
            where,
            select: {
                grads: true,
                studentClass: {
                    select: {
                        Student: {
                            select: {
                                firstName: true,
                                lastName: true,
                                studentId: true
                            }
                        }
                    }
                }
            }
        });
        const studentAverages = {};
        studentGrades.forEach(g => {
            const s = g.studentClass.Student;
            if (!studentAverages[s.studentId]) {
                studentAverages[s.studentId] = { name: `${s.firstName} ${s.lastName}`, total: 0, count: 0 };
            }
            studentAverages[s.studentId].total += g.grads;
            studentAverages[s.studentId].count += 1;
        });
        return Object.values(studentAverages)
            .map(s => ({
            name: s.name,
            average: s.total / s.count
        }))
            .sort((a, b) => b.average - a.average)
            .slice(0, 5);
    }
    async getUpcomingExams(tenantId, classId) {
        // Since exams aren't directly linked to classes in the current schema,
        // we show all future ones for the tenant.
        return this.prisma.exam.findMany({
            where: {
                tenantId,
                dateEnd: { gte: new Date() }
            },
            orderBy: { dateStart: 'asc' },
            take: 5
        });
    }
};
exports.ExamRepository = ExamRepository;
exports.ExamRepository = ExamRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ExamRepository);
