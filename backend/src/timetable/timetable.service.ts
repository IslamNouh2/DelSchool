import { PrismaService } from "prisma/prisma.service";
import { CreateTimetableDto } from "./dto/create-timetable.dto";
import { Injectable } from "@nestjs/common";
import { UpdateTimetableDto } from "./dto/update-timetable.dto";

@Injectable()
export class TimetableService {
    constructor(private prisma: PrismaService) { }

    create(dto: CreateTimetableDto) {
        return this.prisma.timetable.create({ data: dto });
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
            }
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
                day: day,
                classId,
                timeSlotId,
                academicYear,
            },
            include: {
                subject: true,
                teacher: true,
                timeSlot: true,
                Class:true,
            },
        });
    }

    update(id: number, dto: UpdateTimetableDto) {
        return this.prisma.timetable.update({ where: { id }, data: dto });
    }

    remove(id: number) {
        return this.prisma.timetable.delete({ where: { id } });
    }
}