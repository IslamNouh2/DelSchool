import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLocalDto } from './DTO/CreateLocal.dto';

@Injectable()
export class LocalService {
    constructor(private prisma: PrismaService) { };

    async GetLocal(page: number = 1, limit: number = 10, orderByField: string) {
        const skip = (page - 1) * limit;

        const [locals, total] = await this.prisma.$transaction([
            this.prisma.local.findMany({
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
            this.prisma.local.count(),
        ]);

        return {
            locals,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }


    async CreateLocal(dto: CreateLocalDto) {
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
            },
        });

        return Locals;
    }

    async UpdateLocal(id: number, dto: CreateLocalDto) {

        const {
            NumClass,
            name,
            code,
        } = dto;


        const Locals = await this.prisma.local.update({
            where: { localId: id },
            data: {
                NumClass,
                name,
                code,
            },
        });

        return Locals;
    }

    async DeleteLocal(id: number) {
        const local = await this.prisma.local.findUnique({ where: { localId: id } });

        if (!local) {
            throw new Error('LOCAL NOT FOUND');
        }

        await this.prisma.local.delete({ where: { localId: id } });
    }


    async CountLocals() {
        const count = await this.prisma.local.count();
        return count
    }

    async getAllLocals() {
        return this.prisma.local.findMany();
    }
}
