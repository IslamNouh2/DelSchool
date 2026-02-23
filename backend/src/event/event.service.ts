import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEventDto } from './dto/CreateEventDto';
import { UpdateEventDto } from './dto/UpdateEventDto';

@Injectable()
export class EventService {
    private readonly logger = new Logger(EventService.name);

    constructor(private prisma: PrismaService) {}

    async create(dto: CreateEventDto) {
        return this.prisma.event.create({
            data: {
                ...dto,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
            },
        });
    }

    async findAll() {
        try {
            return await this.prisma.event.findMany({
                orderBy: { startTime: 'asc' },
            });
        } catch (error) {
            this.logger.error('Error in EventService.findAll:', error);
            throw error;
        }
    }

    async findOne(id: number) {
        const event = await this.prisma.event.findUnique({
            where: { id },
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }

    async update(id: number, dto: UpdateEventDto) {
        const data: any = { ...dto };
        if (dto.startTime) data.startTime = new Date(dto.startTime);
        if (dto.endTime) data.endTime = new Date(dto.endTime);

        try {
            return await this.prisma.event.update({
                where: { id },
                data,
            });
        } catch (error) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
    }

    async remove(id: number) {
        try {
            await this.prisma.event.delete({
                where: { id },
            });
            return { message: 'Event deleted successfully' };
        } catch (error) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
    }
}
