import { PrismaService } from "prisma/prisma.service";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";

@Injectable()
export class TimetableService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTimetableDto) {
        return this.prisma.$transaction(async (tx) => {
            // ✅ 1. Prevent duplicate timetables
            const exists = await tx.timetable.findFirst({
                where: {
                    day: dto.day,
                    classId: dto.classId,
                    timeSlotId: dto.timeSlotId,
                    academicYear: dto.academicYear,
                },
            });

            if (exists) {
                throw new BadRequestException(
                    `Timetable already exists for class ${dto.classId} on ${dto.day} at slot ${dto.timeSlotId}.`
                );
            }

            // ✅ 2. Auto-assign teacher if not provided
            let assignedTeacherId = dto.employerId;

            if (!assignedTeacherId) {
                const teacherSubject = await tx.teacherSubject.findFirst({
                    where: {
                        subjectId: dto.subjectId,
                        isCurrent: true,
                    },
                    select: { employerId: true },
                });

                if (!teacherSubject) {
                    throw new NotFoundException(
                        `No teacher assigned for subject ID ${dto.subjectId}.`
                    );
                }

                assignedTeacherId = teacherSubject.employerId;
            }

            // ✅ 3. Create timetable
            return tx.timetable.create({
                data: {
                    ...dto,
                    employerId: assignedTeacherId,
                },
                include: {
                    teacher: true,
                    subject: true,
                    Class: true,
                    timeSlot: true,
                },
            });
        });
    }

    async getAll() {
        return this.prisma.timetable.findMany({
            include: {
                timeSlot: true,
                subject: true,
                Class: true,
                teacher: true,
            },
            orderBy: { id: "asc" },
        });
    }

    async getByClass(classId: number) {
        return this.prisma.timetable.findMany({
            where: { classId },
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { day: "asc" },
        });
    }

    async getByTeacher(employerId: number) {
        return this.prisma.timetable.findMany({
            where: { employerId },
            include: {
                Class: true,
                subject: true,
                timeSlot: true,
            },
        });
    }

    async getByStudent(studentId: number) {
        // Find the current class of the student
        const currentClass = await this.prisma.studentClass.findFirst({
            where: { studentId, isCurrent: true },
            select: { classId: true },
        });

        if (!currentClass) {
            throw new NotFoundException("No current class found for this student.");
        }

        // Fetch timetable by classId
        return this.prisma.timetable.findMany({
            where: { classId: currentClass.classId },
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
            },
            orderBy: { day: "asc" },
        });
    }

    async findByUniqueFields(
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
            },
            include: {
                subject: true,
                teacher: true,
                timeSlot: true,
                Class: true,
            },
        });
    }

    async update(id: number, dto: UpdateTimetableDto) {
        const existing = await this.prisma.timetable.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Timetable not found");

        return this.prisma.timetable.update({
            where: { id },
            data: dto,
            include: {
                teacher: true,
                subject: true,
                timeSlot: true,
                Class: true,
            },
        });
    }

    async remove(id: number) {
        const existing = await this.prisma.timetable.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException("Timetable not found");

        return this.prisma.timetable.delete({ where: { id } });
    }
}
