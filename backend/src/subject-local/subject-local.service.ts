import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocalSubjectBulkDto } from './dto/create-local-subject-bulk.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class SubjectLocalService {
  constructor(
    private prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async bulkInsert(tenantId: string, dto: CreateLocalSubjectBulkDto) {
    const { localId, subjectIds } = dto;

    const records = subjectIds.map((subjectId) => ({
      localId,
      subjectId,
      cloture: false,
      dateCreate: new Date(),
      tenantId, // Enforce tenant
    }));

    const result = await this.prisma.subject_local.createMany({
      data: records,
      skipDuplicates: true,
    });
    this.socketGateway.emitRefresh();
    return result;
  }

  async getSubjectsByLocal(tenantId: string, localId: number) {
    return this.prisma.subject_local.findMany({
      where: {
        localId: Number(localId),
        tenantId, // Enforce tenant
      },
      include: {
        subject: true, // includes subject details (name, etc.)
      },
    });
  }

  async removeSubjectFromLocal(
    tenantId: string,
    localId: number,
    subjectId: number,
  ) {
    const record = await this.prisma.subject_local.findFirst({
      where: {
        localId,
        subjectId,
        tenantId, // Enforce tenant
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
