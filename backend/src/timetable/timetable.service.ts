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
}
