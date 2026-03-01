import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(data: { name: string; description?: string; parentId?: number }) {
    return this.prisma.role.create({ data });
  }

  async update(id: number, data: { name?: string; description?: string; parentId?: number }) {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return this.prisma.role.delete({ where: { id } });
  }

  async assignPermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermission(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }
}
