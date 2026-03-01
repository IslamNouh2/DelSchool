import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class SchoolYearService {
    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }

    async findAll(tenantId: string) {
        return this.prisma.schoolYear.findMany({
            where: { tenantId },
            orderBy: { year: 'desc' }
        });
    }

    async create(tenantId: string, data: { year: string; startDate: Date; endDate: Date; isCurrent?: boolean }) {
        if (data.isCurrent) {
            // Set all others to false
            await this.prisma.schoolYear.updateMany({
                where: { isCurrent: true, tenantId },
                data: { isCurrent: false }
            });
        }
        const result = await this.prisma.schoolYear.create({
            data: { ...data, tenantId }
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async update(tenantId: string, id: number, data: { year?: string; startDate?: Date; endDate?: Date; isCurrent?: boolean }) {
        if (data.isCurrent) {
            await this.prisma.schoolYear.updateMany({
                where: { isCurrent: true, tenantId },
                data: { isCurrent: false }
            });
        }
        const result = await this.prisma.schoolYear.update({
            where: { id, tenantId },
            data
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async remove(tenantId: string, id: number) {
        const result = await this.prisma.schoolYear.delete({
            where: { id, tenantId }
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async getCurrentYear(tenantId: string) {
        return this.prisma.schoolYear.findFirst({
            where: { isCurrent: true, tenantId }
        });
    }
}
