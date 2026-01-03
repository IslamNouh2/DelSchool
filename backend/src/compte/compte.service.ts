import { Injectable } from '@nestjs/common';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';


@Injectable()
export class CompteService {
    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) { }


    async create(createCompteDto: CreateCompteDto) {
        let { name, parentId, employerId, studentId, okBlock } = createCompteDto;
        parentId = parentId ?? -1;

        // Step 1: Get BG, BD, and calculate level of the parent
        const parent = await this.prisma.compte.findUnique({
            where: { id: parentId },
            select: { BG: true, BD: true, level: true },
        });

        if (!parent && parentId !== -1) {
            throw new Error('Parent account not found');
        }

        const { BG: parentBG, BD: parentBD, level: parentLevel } = parent || {
            BG: 0,
            BD: 0,
            level: -1,
        };

        // Calculate the new account's level
        const level = parentId === -1 ? 0 : (parentLevel ?? 0) + 1;

        // Step 2: Use transaction to update & insert
        return this.prisma.$transaction(async (tx) => {
            // Update existing accounts' BG/BD values
            await tx.compte.updateMany({
                where: { BG: { gt: parentBD } },
                data: { BG: { increment: 2 } },
            });

            await tx.compte.updateMany({
                where: { BD: { gte: parentBD } },
                data: { BD: { increment: 2 } },
            });

            // Create the new account with calculated level
            const newCompte = await tx.compte.create({
                data: {
                    name,
                    parentId,
                    BG: parentBD,
                    BD: parentBD + 1,
                    level,
                    dateCreate: new Date(),
                    dateModif: new Date(),
                    okBlock: okBlock ?? false,
                    employerId,
                    studentId,
                } as any,
            });

            this.socketGateway.emitRefresh();
            return newCompte;
        });
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        name?: string,
        status?: string,
    ) {
        const skip = (page - 1) * limit;

        const where: any = {
            id: { gt: -1 },
        };

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            };
        }

        if (status) {
            if (status === 'active') where.okBlock = false;
            else if (status === 'blocked') where.okBlock = true;
        }

        const [comptes, total] = await this.prisma.$transaction([
            this.prisma.compte.findMany({
                where,
                orderBy: { BG: 'asc' },
                skip,
                take: limit,
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    employer: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    },
                    student: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                } as any,
            }),
            this.prisma.compte.count({ where }),
        ]);

        return {
            comptes,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        return this.prisma.compte.findUnique({
            where: { id },
            include: { 
                parent: { select: { id: true, name: true } },
                employer: true,
                student: true
            } as any,
        });
    }

    async update(id: number, updateDto: UpdateCompteDto) {
        const { name, parentId: newParentIdInput, okBlock, employerId, studentId } = updateDto;
        const parentId = newParentIdInput;

        const current = await this.prisma.compte.findUnique({
            where: { id },
            select: { BG: true, BD: true, parentId: true },
        });

        if (!current) throw new Error('Account not found');

        // If parent changed, handle nested set movement
        if (parentId !== undefined && current.parentId !== parentId) {
            const parent = await this.prisma.compte.findUnique({
                where: { id: parentId },
                select: { BD: true },
            });

            if (!parent && parentId !== -1) throw new Error('New parent not found');

            const width = current.BD - current.BG + 1;

            await this.prisma.$transaction(async (tx) => {
                // Temporarily remove the current node and its subtree
                await tx.compte.updateMany({
                    where: {
                        BG: { gte: current.BG },
                        BD: { lte: current.BD },
                    },
                    data: {
                        BG: { increment: -current.BG },
                        BD: { increment: -current.BG },
                    },
                });

                await tx.compte.updateMany({
                    where: { BG: { gt: current.BD } },
                    data: { BG: { decrement: width } },
                });

                await tx.compte.updateMany({
                    where: { BD: { gt: current.BD } },
                    data: { BD: { decrement: width } },
                });

                // Make room under new parent
                const newPos = parentId === -1 ? 1 : parent!.BD;

                await tx.compte.updateMany({
                    where: { BG: { gte: newPos } },
                    data: { BG: { increment: width } },
                });

                await tx.compte.updateMany({
                    where: { BD: { gte: newPos } },
                    data: { BD: { increment: width } },
                });

                // Move subtree to new location
                await tx.compte.updateMany({
                    where: { BG: { lt: 0 } },
                    data: {
                        BG: { increment: newPos },
                        BD: { increment: newPos },
                    },
                });

                await tx.compte.update({
                    where: { id },
                    data: {
                        name,
                        parentId,
                        okBlock,
                        employerId,
                        dateModif: new Date(),
                    },
                });
            });
        } else {
            await this.prisma.compte.update({
                where: { id },
                data: {
                    name,
                    okBlock,
                    employerId,
                    studentId,
                    dateModif: new Date(),
                } as any,
            });
        }

        this.socketGateway.emitRefresh();
        return { message: 'Account updated successfully' };
    }

    async remove(id: number) {
        const compte = await this.prisma.compte.findUnique({
            where: { id }
        });

        if (!compte) {
            throw new Error("Account Not Exist");
        }

        // For Nested Set, we should ideally update other nodes, but following subject pattern
        await this.prisma.compte.delete({ where: { id } });
        this.socketGateway.emitRefresh();
    }
}
