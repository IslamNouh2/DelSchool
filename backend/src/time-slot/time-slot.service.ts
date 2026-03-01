import { Injectable } from '@nestjs/common';
import { CreateTimeSlotDto } from './dto/CreateTimeSlotDto';
import { UpdateTimeSlotDto } from './dto/UpdateTimeSlotDto';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class TimeSlotService {
    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }

    async create(tenantId: string, dto: CreateTimeSlotDto) {
        const result = await this.prisma.timeSlot.create({ 
            data: { ...dto, tenantId } 
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    findAll(tenantId: string) {
        return this.prisma.timeSlot.findMany({ 
            where: { tenantId },
            orderBy: { startTime: 'asc' } 
        });
    }

    async update(tenantId: string, id: number, dto: UpdateTimeSlotDto) {
        const result = await this.prisma.timeSlot.update({ 
            where: { id, tenantId }, 
            data: dto 
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async remove(tenantId: string, id: number) {
        const result = await this.prisma.timeSlot.delete({ 
            where: { id, tenantId } 
        });
        this.socketGateway.emitRefresh();
        return result;
    }
}
