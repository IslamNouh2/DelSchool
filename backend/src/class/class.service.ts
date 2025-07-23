import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateClassDto } from './DTO/CreateClass.dto';
import { UpdateClassDto } from './DTO/UpdateClass.dto';

@Injectable()
export class ClassService {
    constructor(private prisma: PrismaService) { };

    async GetClasses(page: number = 1, limit: number = 10, orderByField: string = 'dateCreate') {
        const skip = (page - 1) * limit;

        const [classes, total] = await this.prisma.$transaction([
            this.prisma.classes.findMany({
                orderBy: {
                    [orderByField]: 'desc',
                },
                include: {
                    local: true,
                },
                skip,
                take: limit,
            }),
            this.prisma.classes.count(),
        ]);

        return {
            classes, 
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }


    async CreateClass(dto: CreateClassDto) {
        const {
            ClassName,
            code,
            okBlock,
            localName,
            NumStudent,
        } = dto;

        // Get the local by its name
        const local = await this.prisma.local.findFirst({
            where: {
                name: localName,
            },
        });

        if (!local) {
            throw new Error(`❌ Local with name "${localName}" not found.`);
        }

        // Create the class using the resolved localId
        const Classe = await this.prisma.classes.create({
            data: {
                ClassName,
                localId: local.localId,
                code,
                NumStudent,
                okBlock,
            },
        });

        return Classe;
    }

    async UpdateLocal(id: number, dto: UpdateClassDto) {

        const {
            ClassName,
            code,
            okBlock,
            localName,
            NumStudent,
        } = dto;

        const local = await this.prisma.local.findFirst({
            where: {
                name: localName,
            },
        });
        if (!local) {
            throw new Error(`❌ Local with name "${localName}" not found.`);
        }

        const Classe = await this.prisma.classes.update({
            where: { classId: id },
            data: {
                ClassName,
                localId: local.localId,
                code,
                NumStudent,
                okBlock,
            },
        });

        
        return Classe;
    }

    async DeleteLocal(id: number) {

        const classe = await this.prisma.classes.findUnique({ where: { classId: id } });

        if (!classe ) {
            throw new Error('Class NOT FOUND');
        }

        await this.prisma.classes.delete({ where: { classId: id } });
    }
}
