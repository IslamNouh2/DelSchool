import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/CreateEventDto';
import { UpdateEventDto } from './dto/UpdateEventDto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async create(tenantId: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        tenantId, // Enforce tenant
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
    this.socketGateway.emitRefresh();
    return event;
  }

  async findAll(tenantId: string, role?: string) {
    try {
      const where: import('@prisma/client').Prisma.EventWhereInput = {
        tenantId,
      };

      // If student, only show public events
      if (role === 'STUDENT') {
        where.isPublic = true;
      }

      return await this.prisma.event.findMany({
        where,
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      this.logger.error('Error in EventService.findAll:', error);
      throw error;
    }
  }

  async findOne(tenantId: string, id: number) {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(tenantId: string, id: number, dto: UpdateEventDto) {
    const data: import('@prisma/client').Prisma.EventUpdateInput = { ...dto };
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);

    try {
      const event = await this.prisma.event.update({
        where: { id }, // id is unique globally but we check tenant in findOne or can add it to where
        data: {
          ...data,
          tenantId, // Optional but good for consistency
        },
      });
      this.socketGateway.emitRefresh();
      return event;
    } catch {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }

  async remove(tenantId: string, id: number) {
    try {
      // Check existence and tenant
      await this.findOne(tenantId, id);

      await this.prisma.event.delete({
        where: { id },
      });
      this.socketGateway.emitRefresh();
      return { message: 'Event deleted successfully' };
    } catch {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }
}
