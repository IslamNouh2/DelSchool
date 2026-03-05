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

    async generateDynamicSlots(tenantId: string) {
        // 1. Get Settings
        let settings = await this.prisma.systemSettings.findFirst({
            where: { tenantId }
        });

        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: { tenantId }
            });
        }

        const { firstHour, lastHour, slotDuration } = settings;

        // 2. Clear existing slots for this tenant to avoid duplicates/confusion
        // (Optional: depending on if the user wants to keep manual ones. Usually for dynamic auto-gen, we clear or update)
        await this.prisma.timeSlot.deleteMany({
            where: { tenantId }
        });

        // 3. Generate slots
        const slots = [];
        let [currentH, currentM] = firstHour.split(':').map(Number);
        const [endH, endM] = lastHour.split(':').map(Number);

        const endTimeInMinutes = endH * 60 + endM;
        let currentTimeInMinutes = currentH * 60 + currentM;

        let index = 1;
        while (currentTimeInMinutes + slotDuration <= endTimeInMinutes) {
            const startStr = this.formatTime(currentTimeInMinutes);
            const nextTime = currentTimeInMinutes + slotDuration;
            const endStr = this.formatTime(nextTime);

            slots.push({
                label: `Slot ${index}`,
                startTime: startStr,
                endTime: endStr,
                tenantId
            });

            currentTimeInMinutes = nextTime;
            index++;
        }

        if (slots.length > 0) {
            await this.prisma.timeSlot.createMany({
                data: slots
            });
        }

        this.socketGateway.emitRefresh();
        return { count: slots.length, slots };
    }

    private formatTime(totalMinutes: number): string {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
}
