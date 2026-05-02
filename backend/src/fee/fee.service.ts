import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { SubscribeStudentDto } from './dto/subscribe-student.dto';
import { JournalEntryStatus, Fee } from '@prisma/client';

import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class FeeService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  // Constants for internal accounting (would ideally be configurable)
  private readonly STUDENT_RECEIVABLE_ACCOUNT_ID = 4; // Placeholder
  private readonly INCOME_ACCOUNT_ID = 5; // Placeholder
  private readonly GENERAL_JOURNAL_ID = 1; // Placeholder

  async createTemplate(tenantId: string, dto: CreateFeeDto) {
    const res = await this.prisma.fee.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        description: dto.description,
        compteId: dto.compteId,
        dateStartConsommation: dto.dateStartConsommation
          ? new Date(dto.dateStartConsommation)
          : null,
        dateEndConsommation: dto.dateEndConsommation
          ? new Date(dto.dateEndConsommation)
          : null,
        tenantId,
      },
    });
    this.socketGateway.emitRefresh();
    return res;
  }

  async findAllTemplates(tenantId: string) {
    return this.prisma.fee.findMany({
      where: {
        studentId: null,
        classId: null,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async subscribeStudent(tenantId: string, dto: SubscribeStudentDto) {
    return this.prisma.$transaction(async (tx) => {
      const templates = await tx.fee.findMany({
        where: {
          id: { in: dto.templateIds },
          tenantId,
        },
      });

      if (templates.length !== dto.templateIds.length) {
        throw new NotFoundException('Some fee templates not found');
      }

      const results: Fee[] = [];
      for (const template of templates) {
        // Check if already subscribed
        const existing = await tx.fee.findFirst({
          where: {
            studentId: dto.studentId,
            title: template.title,
            amount: template.amount,
            dueDate: new Date(dto.dueDate || template.dueDate),
            tenantId,
          },
        });

        if (existing) {
          results.push(existing);
          continue;
        }

        const studentFee = await tx.fee.create({
          data: {
            title: template.title,
            amount: template.amount,
            dueDate: new Date(dto.dueDate || template.dueDate),
            description: template.description,
            studentId: dto.studentId,
            compteId: template.compteId,
            dateStartConsommation: template.dateStartConsommation,
            dateEndConsommation: template.dateEndConsommation,
            tenantId,
          },
        });

        await tx.journalEntry.create({
          data: {
            journalId: this.GENERAL_JOURNAL_ID,
            entryNumber: `FEE-${studentFee.id}-${Date.now()}`,
            referenceType: 'STUDENT_FEE',
            referenceId: studentFee.id,
            description: `Fee: ${template.title} for Student #${dto.studentId}`,
            totalDebit: template.amount,
            totalCredit: template.amount,
            status: JournalEntryStatus.POSTED,
            createdBy: 1,
            tenantId,
            lines: {
              create: [
                {
                  lineNumber: 1,
                  compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                  debit: template.amount,
                  credit: 0,
                  tenantId,
                },
                {
                  lineNumber: 2,
                  compteId: template.compteId || this.INCOME_ACCOUNT_ID,
                  debit: 0,
                  credit: template.amount,
                  tenantId,
                },
              ],
            },
          },
        });
        results.push(studentFee);
      }
      this.socketGateway.emitRefresh();
      return results;
    });
  }

  async subscribeAll(tenantId: string, templateId: number, dueDate: string) {
    return this.prisma.$transaction(async (tx) => {
      const template = await tx.fee.findUnique({
        where: { id: templateId, tenantId },
      });
      if (!template) throw new NotFoundException('Template not found');

      // 1. Fetch all students who DON'T already have this fee
      const existingSubscribers = await tx.fee.findMany({
        where: { title: template.title, tenantId, studentId: { not: null } },
        select: { studentId: true },
      });
      const existingIds = new Set(existingSubscribers.map((s) => s.studentId));

      const students = await tx.student.findMany({
        where: {
          tenantId,
          studentId: { notIn: Array.from(existingIds) },
        },
        select: { studentId: true },
      });

      if (students.length === 0) return [];

      // 2. Batch Create Fees (Prisma 6 supports createManyAndReturn)
      const feeData = students.map((student) => ({
        title: template.title,
        amount: template.amount,
        dueDate: new Date(dueDate),
        description: template.description,
        studentId: student.studentId,
        compteId: template.compteId,
        dateStartConsommation: template.dateStartConsommation,
        dateEndConsommation: template.dateEndConsommation,
        tenantId,
      }));

      // Since createManyAndReturn is best for performance but might have limits in batch size,
      // we'll use it to get the IDs for journal entries.
      const createdFees = await tx.fee.createManyAndReturn({
        data: feeData,
      });

      // 3. Prepare Bulk Journal Entries
      // Note: journalEntry doesn't support createMany with nested lines in Prisma,
      // so we create the entries first, then the lines.
      const now = Date.now();
      const journalEntriesData = createdFees.map((fee) => ({
        journalId: this.GENERAL_JOURNAL_ID,
        entryNumber: `BULK-${fee.id}-${now}`,
        referenceType: 'STUDENT_FEE',
        referenceId: fee.id,
        description: `Bulk Fee: ${template.title} for Student #${fee.studentId}`,
        totalDebit: template.amount,
        totalCredit: template.amount,
        status: JournalEntryStatus.POSTED,
        createdBy: 1,
        tenantId,
      }));

      // Create journal entries in one hit
      const createdEntries = await tx.journalEntry.createManyAndReturn({
        data: journalEntriesData,
      });

      // 4. Batch Create Journal Lines
      const linesData: any[] = [];
      createdEntries.forEach((entry) => {
        linesData.push({
          entryId: entry.id,
          lineNumber: 1,
          compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
          debit: template.amount,
          credit: 0,
          tenantId,
        });
        linesData.push({
          entryId: entry.id,
          lineNumber: 2,
          compteId: template.compteId || this.INCOME_ACCOUNT_ID,
          debit: 0,
          credit: template.amount,
          tenantId,
        });
      });

      await tx.journalLine.createMany({
        data: linesData,
      });

      this.socketGateway.emitRefresh();
      return createdFees;
    });
  }

  async createManualFee(tenantId: string, dto: CreateFeeDto) {
    // Check for duplicate fee
    const existingFee = await this.prisma.fee.findFirst({
      where: {
        studentId: dto.studentId,
        title: dto.title,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        tenantId,
      },
    });

    if (existingFee) {
      throw new BadRequestException(
        'A fee with this title, amount and due date already exists for this student.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const fee = await tx.fee.create({
        data: {
          title: dto.title,
          amount: dto.amount,
          dueDate: new Date(dto.dueDate),
          description: dto.description,
          studentId: dto.studentId,
          compteId: dto.compteId,
          dateStartConsommation: dto.dateStartConsommation
            ? new Date(dto.dateStartConsommation)
            : null,
          dateEndConsommation: dto.dateEndConsommation
            ? new Date(dto.dateEndConsommation)
            : null,
          tenantId,
        },
      });

      await tx.journalEntry.create({
        data: {
          journalId: this.GENERAL_JOURNAL_ID,
          entryNumber: `MANUAL-FEE-${fee.id}-${Date.now()}`,
          referenceType: 'STUDENT_FEE',
          referenceId: fee.id,
          description: `Manual Fee: ${dto.title}`,
          totalDebit: dto.amount,
          totalCredit: dto.amount,
          status: JournalEntryStatus.POSTED,
          createdBy: 1,
          tenantId,
          lines: {
            create: [
              {
                lineNumber: 1,
                compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                debit: dto.amount,
                credit: 0,
                tenantId,
              },
              {
                lineNumber: 2,
                compteId: dto.compteId || this.INCOME_ACCOUNT_ID,
                debit: 0,
                credit: dto.amount,
                tenantId,
              },
            ],
          },
        },
      });
      this.socketGateway.emitRefresh();
      return fee;
    });
  }

  async getStudentFees(tenantId: string, studentId: number) {
    return this.prisma.fee.findMany({
      where: { studentId, tenantId },
      include: {
        payments: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getPendingFees(tenantId: string, studentId: number) {
    const fees = await this.prisma.fee.findMany({
      where: { studentId, tenantId },
      include: {
        payments: true,
      },
    });

    return fees
      .map((fee) => {
        const totalPaid = fee.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        const remaining = Number(fee.amount) - totalPaid;
        return {
          ...fee,
          totalPaid,
          remaining,
        };
      })
      .filter((fee) => fee.remaining > 0);
  }

  async getStudentFinancialStatus(tenantId: string, studentId: number) {
    const fees = await this.prisma.fee.findMany({
      where: { studentId, tenantId },
      include: {
        payments: true,
      },
    });

    if (fees.length === 0) return 'UPCOMING';

    let totalDue = 0;
    let totalPaid = 0;
    let hasOverdue = false;
    const now = new Date();

    for (const fee of fees) {
      const feeAmount = Number(fee.amount);
      const feePaid = fee.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      totalDue += feeAmount;
      totalPaid += feePaid;

      if (feePaid < feeAmount && new Date(fee.dueDate) < now) {
        hasOverdue = true;
      }
    }

    if (totalPaid >= totalDue) return 'PAID';
    if (hasOverdue) return 'OVERDUE';
    if (totalPaid > 0) return 'PARTIAL';
    return 'UPCOMING';
  }

  async deleteFee(tenantId: string, id: number) {
    const res = await this.prisma.fee.delete({
      where: { id, tenantId },
    });
    this.socketGateway.emitRefresh();
    return res;
  }
}
