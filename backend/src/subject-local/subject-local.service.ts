import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLocalSubjectBulkDto } from './dto/create-local-subject-bulk.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class SubjectLocalService {

    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { };

    async bulkInsert(dto: CreateLocalSubjectBulkDto) {
        const { localId, subjectIds } = dto;

        const records = subjectIds.map((subjectId) => ({
            localId,
            subjectId,
            cloture: false,
            dateCreate: new Date(),
        }));

        const result = await this.prisma.subject_local.createMany({
            data: records,
            skipDuplicates: true,
        });
        this.socketGateway.emitRefresh();
        return result;
    }


    async getSubjectsByLocal(localId: number) {
        return this.prisma.subject_local.findMany({
            where: { localId: Number(localId) },
            include: {
                subject: true, // includes subject details (name, etc.)
            },
        });
    }

    async removeSubjectFromLocal(localId: number, subjectId: number) {
        const record = await this.prisma.subject_local.findFirst({
            where: {
                localId,
                subjectId,
            },
        });

        if (!record) {
            throw new NotFoundException('Subject not assigned to this local.');
        }

        const result = await this.prisma.subject_local.delete({
            where: {
                subjectLocalId: record.subjectLocalId,
            },
        });
        this.socketGateway.emitRefresh();
        return { message: 'Subject removed from local successfully.' };
    }
}
