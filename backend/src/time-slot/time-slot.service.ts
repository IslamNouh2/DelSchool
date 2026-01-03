import { Injectable } from '@nestjs/common';
import { CreateTimeSlotDto } from './dto/CreateTimeSlotDto';
import { UpdateTimeSlotDto } from './dto/UpdateTimeSlotDto';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class TimeSlotService {
    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }

    async create(dto: CreateTimeSlotDto) {
        const result = await this.prisma.timeSlot.create({ data: dto });
        this.socketGateway.emitRefresh();
        return result;
    }

    findAll() {
        return this.prisma.timeSlot.findMany({ orderBy: { startTime: 'asc' } });
    }

    async update(id: number, dto: UpdateTimeSlotDto) {
        const result = await this.prisma.timeSlot.update({ where: { id }, data: dto });
        this.socketGateway.emitRefresh();
        return result;
    }

    async remove(id: number) {
        const result = await this.prisma.timeSlot.delete({ where: { id } });
        this.socketGateway.emitRefresh();
        return result;
    }
}
