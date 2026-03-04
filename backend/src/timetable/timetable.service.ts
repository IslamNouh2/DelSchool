import { PrismaService } from "../prisma/prisma.service";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";
import { SocketGateway } from "../socket/socket.gateway";

@Injectable()
export class TimetableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }

    async create(tenantId: string, dto: CreateTimetableDto) {
        return this.prisma.$transaction(async (tx) => {
            // ✅ 1. Prevent duplicate timetables
            const exists = await tx.timetable.findFirst({
                where: {
                    day: dto.day,
                    classId: dto.classId,
                    timeSlotId: dto.timeSlotId,
                    academicYear: dto.academicYear,
                    tenantId, // Enforce tenant
                },
            });

            if (exists) {
                throw new BadRequestException(
                    `Timetable already exists for class ${dto.classId} on ${dto.day} at slot ${dto.timeSlotId}.`
                );
            }

            // ✅ 2. Auto-assign teacher if not provided
            let assignedTeacherId: number | null = dto.employerId || null;

            if (!assignedTeacherId) {
                const teacherSubject = await tx.teacherSubject.findFirst({
                    where: {
                        subjectId: dto.subjectId,
                        isCurrent: true,
                        tenantId, // Enforce tenant
                    },
                    select: { employerId: true },
                });

                if (teacherSubject) {
                    assignedTeacherId = teacherSubject.employerId;
                }
                // If no teacher found, assignedTeacherId remains null, which is valid
            }

            // ✅ 3. Create timetable
            const result = await tx.timetable.create({
                data: {
                    ...dto,
                    employerId: assignedTeacherId,
                    tenantId, // Enforce tenant
                },
                include: {
                    teacher: true,
                    subject: true,
                    Class: true,
                    timeSlot: true,
                },
            });
            this.socketGateway.emitRefresh();
            return result;
        });
    }

    async getAll(tenantId: string) {
        return this.prisma.timetable.findMany({
            where: { tenantId }, // Enforce tenant
            include: {
                timeSlot: true,
                subject: true,
                Class: true,
                teacher: true,
            },
            orderBy: { id: "asc" },
        });
    }

    async getByClass(tenantId: string, classId: number) {
        return this.prisma.timetable.findMany({
            where: { classId, tenantId }, // Enforce tenant
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { day: "asc" },
        });
    }

    async getByTeacher(tenantId: string, employerId: number) {
        return this.prisma.timetable.findMany({
            where: { employerId, tenantId }, // Enforce tenant
            include: {
                Class: true,
                subject: true,
                timeSlot: true,
            },
        });
    }

    async getByStudent(tenantId: string, studentId: number) {
        // Find the current class of the student
        const currentClass = await this.prisma.studentClass.findFirst({
            where: { studentId, isCurrent: true, tenantId }, // Enforce tenant
            select: { classId: true },
        });

        if (!currentClass) {
            throw new NotFoundException("No current class found for this student.");
        }

        // Fetch timetable by classId
        return this.prisma.timetable.findMany({
            where: { classId: currentClass.classId, tenantId }, // Enforce tenant
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { day: "asc" },
        });
    }

    async findByUniqueFields(
        tenantId: string,
        day: string,
        classId: number,
        timeSlotId: number,
        academicYear: string
    ) {
        return this.prisma.timetable.findFirst({
            where: {
                day,
                classId,
                timeSlotId,
                academicYear,
                tenantId, // Enforce tenant
            },
            include: {
                subject: true,
                teacher: true,
                timeSlot: true,
                Class: true,
            },
        });
    }

    async checkDuplicate(
        tenantId: string,
        day: string,
        classId: number,
        timeSlotId: number,
        academicYear: string
    ) {
        return this.prisma.timetable.findMany({
            where: {
                day,
                classId,
                timeSlotId,
                academicYear,
                tenantId, // Enforce tenant
            },
            include: {
                subject: true,
                teacher: true,
                timeSlot: true,
                Class: true,
            },
        });
    }

    async update(tenantId: string, id: number, dto: UpdateTimetableDto) {
        const existing = await this.prisma.timetable.findFirst({ 
            where: { id, tenantId } 
        });
        if (!existing) throw new NotFoundException("Timetable not found");

        const result = await this.prisma.timetable.update({
            where: { id },
            data: dto,
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
                Class: true,
            },
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async remove(tenantId: string, id: number) {
        const existing = await this.prisma.timetable.findFirst({ 
            where: { id, tenantId } 
        });
        if (!existing) throw new NotFoundException("Timetable not found");

        const result = await this.prisma.timetable.delete({ where: { id } });
        this.socketGateway.emitRefresh();
        return result;
    }

    async generateAI(tenantId: string, academicYear: string) {
        // 1. Collect all necessary data for optimization
        const [teachers, classesData, subjects, slots, teacherSubjects, teacherClasses] = await Promise.all([
            this.prisma.employer.findMany({ where: { tenantId, type: 'teacher' } }),
            this.prisma.classes.findMany({ 
                where: { tenantId },
                include: { 
                    local: {
                        include: {
                            subject_local: true
                        }
                    }
                }
            }),
            this.prisma.subject.findMany({ where: { tenantId } }),
            this.prisma.timeSlot.findMany({ where: { tenantId } }),
            this.prisma.teacherSubject.findMany({ where: { tenantId } }),
            this.prisma.teaherClass.findMany({ where: { tenantId } }),
        ]);

        // 1b. Build subject requirements based on Local.size
        const subjectRequirements = [];
        classesData.forEach(cls => {
            if (cls.local) {
                const requiredHours = cls.local.size || 0;
                cls.local.subject_local.forEach(sl => {
                    subjectRequirements.push({
                        classId: cls.classId,
                        subjectId: sl.subjectId,
                        requiredHours: requiredHours
                    });
                });
            }
        });

        // 2. Prepare payload for AI microservice
        const payload = {
            teachers: teachers.map(t => ({ id: t.employerId, name: `${t.firstName} ${t.lastName}` })),
            classes: classesData.map(c => ({ id: c.classId, name: c.ClassName })),
            subjects: subjects.map(s => ({ id: s.subjectId, name: s.subjectName })),
            slots: slots.map(s => ({ id: s.id, start: s.startTime, end: s.endTime })),
            teacherAssignments: teachers.map(t => ({
                teacherId: t.employerId,
                subjectIds: teacherSubjects.filter(ts => ts.employerId === t.employerId).map(ts => ts.subjectId),
                classIds: teacherClasses.filter(tc => tc.employerId === t.employerId).map(tc => tc.classId)
            })),
            subjectRequirements,
            academicYear,
        };

        // 3. Call AI microservice (Python FastAPI)
        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/timetable/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new BadRequestException('AI Optimization failed');
            }

            const result = await response.json();

            // 4. Save optimized timetable slots
            return this.prisma.$transaction(async (tx) => {
                // Delete existing AI generated slots for this year/tenant? 
                // Or let the user choose. For now, we'll mark them as AI_GENERATED.
                
                const createdSlots = [];
                for (const slot of result.timetable) {
                    const created = await tx.timetable.create({
                        data: {
                            day: slot.day,
                            classId: slot.classId,
                            subjectId: slot.subjectId,
                            timeSlotId: slot.timeSlotId,
                            employerId: slot.employerId,
                            academicYear,
                            tenantId,
                            mode: 'AI_GENERATED',
                            aiOptimizationScore: result.optimizationScore,
                            aiGeneratedAt: new Date(),
                        }
                    });
                    createdSlots.push(created);
                }

                this.socketGateway.emitRefresh();
                return {
                    slots: createdSlots,
                    score: result.optimizationScore,
                    conflicts: result.conflictCount,
                };
            });
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw new BadRequestException('Could not connect to AI service');
        }
    }

    async getOptimizationScore(tenantId: string, id: number) {
        const timetable = await this.prisma.timetable.findFirst({
            where: { id, tenantId },
            select: { aiOptimizationScore: true, mode: true, aiGeneratedAt: true }
        });

        if (!timetable) throw new NotFoundException('Timetable not found');
        return timetable;
    }
}
