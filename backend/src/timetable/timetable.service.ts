import { PrismaService } from "prisma/prisma.service";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";

@Injectable()
export class TimetableService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateTimetableDto) {
        return this.prisma.$transaction(async (tx) => {
            // 🔹 Check if timetable already exists
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

            // 🔹 Auto-assign teacher from TeacherSubject table
            let assignedTeacher = dto.employerId;

            if (!assignedTeacher) {
                const teacherSubject = await tx.teacherSubject.findFirst({
                    where: {
                        subjectId: dto.subjectId,
                        isCurrent: true, // optional helper field
                    },
                    select: { employerId: true },
                });

                if (!teacherSubject) {
                    throw new NotFoundException(
                        `No teacher assigned for subject ID ${dto.subjectId}.`
                    );
                }

                assignedTeacher = teacherSubject.employerId;
            }

            // 🔹 Create the timetable record
            return tx.timetable.create({
                data: {
                    ...dto,
                    employerId: assignedTeacher,
                },
            });
        });
    }

    getByClass(classId: number) {
        return this.prisma.timetable.findMany({
            where: { classId },
            include: { teacher: true, subject: true, timeSlot: true },
        });
    }

    getByTeacher(employerId: number) {
        return this.prisma.timetable.findMany({
            where: { employerId },
            include: { Class: true, subject: true, timeSlot: true },
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
        });
    }

    async getByStudent(studentId: number) {
        const currentLocal = await this.prisma.studentLocal.findFirst({
            where: { studentId, isCurrent: true },
            include: { local: { include: { classes: true } } },
        });

        const classId = currentLocal?.local?.classes?.[0]?.classId;

        return this.prisma.timetable.findMany({
            where: { classId },
            include: { teacher: true, subject: true, timeSlot: true },
        });
    }

    async findByUniqueFields(day: string, classId: number, timeSlotId: number, academicYear: string) {
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

    update(id: number, dto: UpdateTimetableDto) {
        return this.prisma.timetable.update({ where: { id }, data: dto });
    }

    remove(id: number) {
        return this.prisma.timetable.delete({ where: { id } });
    }

    async checkDuplicate(day: string, classId: number, timeSlotId: number, academicYear: string) {
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
}
