import { PrismaService } from "../prisma/prisma.service";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";
import { SocketGateway } from "../socket/socket.gateway";
import { TimetableOptimizerService } from "../timetable-optimizer/timetable-optimizer.service";

@Injectable()
export class TimetableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly socketGateway: SocketGateway,
        private readonly aiOptimizer: TimetableOptimizerService
    ) { }

    async create(tenantId: string, dto: CreateTimetableDto) {
// ... (rest of the create logic remains the same)
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

            // ✅ 2. Validate Weekly Hours
            const subject = await tx.subject.findUnique({
                where: { subjectId: dto.subjectId }
            });

            if (!subject) {
                throw new NotFoundException("Subject not found");
            }

            // Understand if the subject is a Break/Lunch
            const sName = subject.subjectName.toLowerCase();
            const isBreak = sName.includes("break") || sName.includes("lunch") || sName.includes("pause") || sName.includes("استراحة");

            if (!isBreak) {
                // Fetch the Local (class) weekly limit
                const classData = await tx.classes.findUnique({
                    where: { classId: dto.classId },
                    include: { local: true }
                });

                if (classData && classData.local) {
                    const localWeeklyHours = classData.local.weeklyHours;

                    // Count all existing lessons in the timetable for that class
                    const existingTimetable = await tx.timetable.findMany({
                        where: {
                            classId: dto.classId,
                            academicYear: dto.academicYear,
                            tenantId
                        },
                        include: { subject: true }
                    });

                    // Exclude subjects where it's a break
                    const nonBreakLessonsCount = existingTimetable.filter(t => {
                        const n = t.subject?.subjectName?.toLowerCase() || '';
                        return !(n.includes("break") || n.includes("lunch") || n.includes("pause") || n.includes("استراحة"));
                    }).length;

                    // Compare with Local.weeklyHours
                    if (nonBreakLessonsCount >= localWeeklyHours) {
                        throw new BadRequestException("Class weekly hours limit reached");
                    }
                }
            }

            // ✅ 3. Auto-assign teacher if not provided
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
            }

            // ✅ 4. Create timetable
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
        return this.aiOptimizer.generateAI(tenantId, academicYear);
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
