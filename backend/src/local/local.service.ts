import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';

import { CreateLocalDto } from './DTO/CreateLocal.dto';

@Injectable()
export class LocalService {
    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) { };


    async GetLocal(tenantId: string, page: number = 1, limit: number = 10, orderByField: string, search?: string) {
        const skip = (page - 1) * limit;

        const where: any = { tenantId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [locals, total] = await this.prisma.$transaction([
            this.prisma.local.findMany({
                where,
                orderBy: {
                    [orderByField]: 'asc',
                },
                skip,
                take: limit,
                include: {
                    subject_local: {
                        include: {
                            subject: true,
                        }
                    }
                },
            }),
            this.prisma.local.count({ where }),
        ]);

        return {
            locals,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }


    async CreateLocal(tenantId: string, dto: CreateLocalDto) {
        const {
            NumClass,
            name,
            code,
        } = dto;

        const Locals = await this.prisma.local.create({
            data: {
                NumClass,
                name,
                code,
                size: dto.size || 0,
                tenantId,
            },
        });

        this.socketGateway.emitRefresh();
        return Locals;
    }

    async UpdateLocal(tenantId: string, id: number, dto: CreateLocalDto) {

        const {
            NumClass,
            name,
            code,
        } = dto;


        const Locals = await this.prisma.local.update({
            where: { localId: id, tenantId },
            data: {
                NumClass,
                name,
                code,
                size: dto.size !== undefined ? dto.size : undefined,
            },
        });

        this.socketGateway.emitRefresh();
        return Locals;
    }

    async DeleteLocal(tenantId: string, id: number) {
        const local = await this.prisma.local.findUnique({ where: { localId: id, tenantId } });

        if (!local) {
            throw new Error('LOCAL NOT FOUND');
        }

        await this.prisma.local.delete({ where: { localId: id, tenantId } });
        this.socketGateway.emitRefresh();
    }


    async CountLocals(tenantId: string) {
        const count = await this.prisma.local.count({ where: { tenantId } });
        return count
    }

    async getAllLocals(tenantId: string) {
        return this.prisma.local.findMany({
            where: { tenantId },
            include: {
                classes: true
            }
        });
    }
}
