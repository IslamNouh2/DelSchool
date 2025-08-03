import { Injectable } from '@nestjs/common';
import { CreateTimeSlotDto } from './dto/CreateTimeSlotDto';
import { UpdateTimeSlotDto } from './dto/UpdateTimeSlotDto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TimeSlotService {
    constructor(private prisma: PrismaService) { }

    create(dto: CreateTimeSlotDto) {
        return this.prisma.timeSlot.create({ data: dto });
    }

    findAll() {
        return this.prisma.timeSlot.findMany({ orderBy: { startTime: 'asc' } });
    }

    update(id: number, dto: UpdateTimeSlotDto) {
        return this.prisma.timeSlot.update({ where: { id }, data: dto });
    }

    remove(id: number) {
        return this.prisma.timeSlot.delete({ where: { id } });
    }
}
