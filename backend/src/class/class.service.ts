import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';

import { CreateClassDto } from './DTO/CreateClass.dto';
import { UpdateClassDto } from './DTO/UpdateClass.dto';

@Injectable()
export class ClassService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async GetClasses(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    orderByField: string = 'dateCreate',
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId, // Enforce tenant
      ...(search
        ? {
            OR: [
              { ClassName: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [classes, total] = await this.prisma.$transaction([
      this.prisma.classes.findMany({
        where,
        orderBy: {
          [orderByField]: 'desc',
        },
        include: {
          local: true,
          translations: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.classes.count({ where }),
    ]);

    return {
      classes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async CreateClass(tenantId: string, dto: CreateClassDto) {
    const { ClassName, code, okBlock, localName, NumStudent } = dto;

    // Get the local by its name and tenantId
    const local = await this.prisma.local.findFirst({
      where: {
        name: localName,
        tenantId, // Enforce tenant
      },
    });

    if (!local) {
      throw new Error(`errors.local_not_found`);
    }

    // Capacity Check
    if (local.size > 0) {
      const currentTotal = await this.prisma.classes.aggregate({
        where: { localId: local.localId, tenantId }, // Enforce tenant
        _sum: { NumStudent: true },
      });
      const total = (currentTotal._sum.NumStudent || 0) + NumStudent;
      if (total > local.size) {
        throw new Error(`errors.local_capacity_exceeded`);
      }
    }

    // NumClass Check
    if (local.NumClass && local.NumClass > 0) {
      const classCount = await this.prisma.classes.count({
        where: { localId: local.localId, tenantId }, // Enforce tenant
      });
      if (classCount >= local.NumClass) {
        throw new Error(`errors.local_class_limit_reached`);
      }
    }

    // Create the class using the resolved localId
    const Classe = await this.prisma.classes.create({
      data: {
        ClassName,
        localId: local.localId,
        code,
        NumStudent,
        okBlock,
        tenantId, // Store tenantId
        cloture: dto.cloture === true,
        translations: dto.translations
          ? {
              create: Object.entries(dto.translations).map(
                ([locale, name]) => ({
                  locale,
                  name: name,
                }),
              ),
            }
          : undefined,
      },
      include: { translations: true },
    });

    this.socketGateway.emitRefresh();
    return Classe;
  }

  async UpdateLocal(tenantId: string, id: number, dto: UpdateClassDto) {
    const { ClassName, code, okBlock, localName, NumStudent } = dto;

    const local = await this.prisma.local.findFirst({
      where: {
        name: localName,
        tenantId, // Enforce tenant
      },
    });
    if (!local) {
      throw new Error(`errors.local_not_found`);
    }

    // Capacity Check
    if (local.size > 0) {
      const currentTotal = await this.prisma.classes.aggregate({
        where: {
          localId: local.localId,
          tenantId, // Enforce tenant
          NOT: { classId: id }, // Exclude this class from its own total
        },
        _sum: { NumStudent: true },
      });
      const total = (currentTotal._sum.NumStudent || 0) + NumStudent;
      if (total > local.size) {
        throw new Error(`errors.local_capacity_exceeded`);
      }
    }

    // NumClass Check
    if (local.NumClass && local.NumClass > 0) {
      const currentClassCount = await this.prisma.classes.count({
        where: {
          localId: local.localId,
          tenantId, // Enforce tenant
          NOT: { classId: id }, // Exclude this class
        },
      });
      if (currentClassCount >= local.NumClass) {
        throw new Error(
          `❌ Local class limit reached. Maximum classes allowed: ${local.NumClass}`,
        );
      }
    }

    const Classe = await this.prisma.classes.update({
      where: { classId: id, tenantId }, // Enforce tenant
      data: {
        ClassName,
        localId: local.localId,
        code,
        NumStudent,
        okBlock,
        cloture: dto.cloture !== undefined ? dto.cloture : undefined,
        translations: dto.translations
          ? {
              deleteMany: {},
              create: Object.entries(dto.translations).map((l) => ({
                locale: l[0],
                name: l[1],
              })),
            }
          : undefined,
      },
      include: { translations: true },
    });

    this.socketGateway.emitRefresh();
    return Classe;
  }

  async DeleteLocal(tenantId: string, id: number) {
    const classe = await this.prisma.classes.findUnique({
      where: { classId: id, tenantId }, // Enforce tenant
    });

    if (!classe) {
      throw new Error('Class NOT FOUND');
    }

    await this.prisma.classes.delete({
      where: { classId: id, tenantId }, // Enforce tenant
    });
    this.socketGateway.emitRefresh();
  }
}
