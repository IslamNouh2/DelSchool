import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateExamDto } from './DTO/create-exam.dto';
import { Exam, Grads } from '@prisma/client';
import { UpdateExamDto } from './DTO/update-exam.dto';

@Injectable()
export class ExamRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateExamDto): Promise<Exam> {
        return this.prisma.exam.create({
            data: {
                examName: data.examName,
                dateStart: new Date(data.dateStart),
                dateEnd: new Date(data.dateEnd),
                publish: data.publish ?? false,
                dateCreate: new Date(),
                dateModif: new Date(),
            },
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
    }): Promise<{ exams: Exam[]; total: number }> {
        const { skip = 0, take = 10, search } = params;

        const where = search
            ? {
                examName: {
                    contains: search,
                    mode: 'insensitive' as any,
                },
            }
            : {};

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

    async findOne(id: number): Promise<Exam | null> {
        return this.prisma.exam.findUnique({
            where: { id },
        });
    }

    async getExams() {
        return this.prisma.exam.findMany({
            select: {
                id: true,
                examName: true,
            },
        });
    }

    /**
      * Get all subjects for a class with student grades
      */
    async getSubjectOfClass(classId: number, examId: number) {
        // Get class's local
        const classData = await this.prisma.classes.findUnique({
            where: { classId },
            select: { localId: true },
        });

        if (!classData) {
            throw new Error('Class not found');
        }

        // Get all subjects linked to this class
        const classSubjects = await this.prisma.subject.findMany({
            where: {
                subject_local: {
                    some: {
                        localId: classData.localId,
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
                            where: { examId },
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


    async upsertGrades(
        classId: number,
        examId: number,
        grades: { studentId: number; subjectId: number; grade: number }[],
    ) {
        console.log(`[UpsertGrades] Starting for Class: ${classId}, Exam: ${examId}, Count: ${grades.length}`);
        
        if (!Array.isArray(grades)) {
            throw new BadRequestException('grades must be an array');
        }

        const results: Grads[] = [];

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
                    },
                });
                console.log(`[UpsertGrades] Upsert success for Grade ID: ${grad.id}`);
                results.push(grad);
            } catch (error) {
                console.error(`[UpsertGrades] Error upserting grade:`, error);
            }
        }

        return results;
    }

    async update(id: number, data: UpdateExamDto): Promise<Exam> {
        const updateData: any = {
            dateModif: new Date(),
        };

        if (data.examName !== undefined) updateData.examName = data.examName;
        if (data.dateStart !== undefined) updateData.dateStart = new Date(data.dateStart);
        if (data.dateEnd !== undefined) updateData.dateEnd = new Date(data.dateEnd);
        if (data.publish !== undefined) updateData.publish = data.publish;

        return this.prisma.exam.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: number): Promise<Exam> {
        return this.prisma.exam.delete({
            where: { id },
        });
    }

    async togglePublish(id: number, publish: boolean): Promise<Exam> {
        return this.prisma.exam.update({
            where: { id },
            data: {
                publish,
                dateModif: new Date(),
            },
        });
    }

}