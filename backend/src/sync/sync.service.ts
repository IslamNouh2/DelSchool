import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkSyncDto, SyncOperationType } from './dto/sync-payload.dto';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  private readonly idFieldMap: Record<string, string> = {
    student: 'studentId',
    parent: 'parentId',
    local: 'localId',
    classes: 'classId',
    subject: 'subjectId',
    employer: 'employerId',
    compte: 'id',
    fee: 'id',
    expense: 'id',
    payment: 'id',
    studentattendance: 'id',
    employerattendance: 'id',
    timetable: 'id',
    exam: 'id',
    grads: 'id',
    journal: 'id',
    journalentry: 'id',
    journalline: 'id',
    event: 'id',
    schoolyear: 'id',
    timeslot: 'id',
  };

  async processBulkSync(tenantId: string, userId: number, dto: BulkSyncDto) {
    const results: any[] = [];

    for (const op of dto.operations) {
      try {
        const result = await this.executeOperation(tenantId, userId, op);
        results.push({ operationId: op.operationId, status: 'success', data: result });
      } catch (error) {
        results.push({ 
          operationId: op.operationId, 
          status: 'error', 
          message: error.message,
          conflict: error instanceof ConflictException,
          serverData: error instanceof ConflictException ? error.getResponse() : undefined
        });
      }
    }

    return results;
  }

  private async executeOperation(tenantId: string, userId: number, op: any) {
    const entityKey = op.entity.toLowerCase();
    const model = this.prisma[entityKey] as any;
    if (!model) {
      throw new BadRequestException(`Entity ${op.entity} not found`);
    }

    const idField = this.idFieldMap[entityKey] || 'id';

    // Check for idempotency
    const existing = await model.findUnique({
      where: { operationId: op.operationId },
    });

    if (existing) {
      return existing; // Already processed
    }

    switch (op.type) {
      case SyncOperationType.CREATE:
        return model.create({
          data: {
            ...op.data,
            tenantId,
            operationId: op.operationId,
            version: 1,
          },
        });

      case SyncOperationType.UPDATE:
        const recordId = op.data[idField];
        if (!recordId) throw new BadRequestException(`Missing ID field ${idField} in data`);

        const current = await model.findUnique({
          where: { [idField]: recordId },
        });

        if (!current) throw new BadRequestException(`Record ${recordId} not found for entity ${op.entity}`);
        if (current.tenantId !== tenantId) throw new UnauthorizedException('Tenant mismatch');
        
        // Conflict detection (Server-authoritative)
        if (op.version && current.version !== op.version) {
          throw new ConflictException({
            message: 'Version mismatch',
            serverVersion: current.version,
            serverData: current,
          });
        }

        const { [idField]: _, ...updateData } = op.data;

        return model.update({
          where: { [idField]: recordId },
          data: {
            ...updateData,
            version: current.version + 1,
            operationId: op.operationId,
          },
        });

      case SyncOperationType.DELETE:
        const deleteId = op.data[idField];
        return model.delete({
          where: { [idField]: deleteId, tenantId },
        });

      default:
        throw new BadRequestException(`Invalid operation type: ${op.type}`);
    }
  }
}
