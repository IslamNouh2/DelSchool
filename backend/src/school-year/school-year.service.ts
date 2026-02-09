import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class SchoolYearService {
    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }

    async findAll() {
        return this.prisma.schoolYear.findMany({
            orderBy: { year: 'desc' }
        });
    }

    async create(data: { year: string; startDate: Date; endDate: Date; isCurrent?: boolean }) {
        if (data.isCurrent) {
            // Set all others to false
            await this.prisma.schoolYear.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false }
            });
        }
        const result = await this.prisma.schoolYear.create({
            data
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async update(id: number, data: { year?: string; startDate?: Date; endDate?: Date; isCurrent?: boolean }) {
        if (data.isCurrent) {
            await this.prisma.schoolYear.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false }
            });
        }
        const result = await this.prisma.schoolYear.update({
            where: { id },
            data
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async remove(id: number) {
        const result = await this.prisma.schoolYear.delete({
            where: { id }
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async getCurrentYear() {
        return this.prisma.schoolYear.findFirst({
            where: { isCurrent: true }
        });
    }
}
