import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findAll(query: { skip?: number; take?: number; search?: string }) {
        const { skip, take, search } = query;
        return this.prisma.user.findMany({
            skip,
            take,
            where: search ? {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ]
            } : {},
            include: { role: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { 
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                userPermissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
            include: { role: true }
        });
    }

    async update(id: number, data: any) {
        return this.prisma.user.update({
            where: { id },
            data,
            include: { role: true }
        });
    }

    async delete(id: number) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }

    async getStats() {
        const total = await this.prisma.user.count();
        const active = await this.prisma.user.count({ where: { status: 'ACTIVE' } });
        const locked = await this.prisma.user.count({ where: { status: 'LOCKED' } });
        return { total, active, locked };
    }
}
