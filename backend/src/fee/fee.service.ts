import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { SubscribeStudentDto } from './dto/subscribe-student.dto';
import { JournalEntryStatus } from '@prisma/client';

@Injectable()
export class FeeService {
    constructor(private prisma: PrismaService) { }

    // Constants for internal accounting (would ideally be configurable)
    private readonly STUDENT_RECEIVABLE_ACCOUNT_ID = 4; // Placeholder
    private readonly INCOME_ACCOUNT_ID = 5; // Placeholder
    private readonly GENERAL_JOURNAL_ID = 1; // Placeholder

    async createTemplate(dto: CreateFeeDto) {
        return this.prisma.fee.create({
            data: {
                title: dto.title,
                amount: dto.amount,
                dueDate: new Date(dto.dueDate),
                description: dto.description,
                compteId: dto.compteId,
                dateStartConsommation: dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : null,
                dateEndConsommation: dto.dateEndConsommation ? new Date(dto.dateEndConsommation) : null,
            }
        });
    }

    async findAllTemplates() {
        return this.prisma.fee.findMany({
            where: {
                studentId: null,
                classId: null,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async subscribeStudent(dto: SubscribeStudentDto) {
        return this.prisma.$transaction(async (tx) => {
            const templates = await tx.fee.findMany({
                where: {
                    id: { in: dto.templateIds },
                },
            });

            if (templates.length !== dto.templateIds.length) {
                throw new NotFoundException('Some fee templates not found');
            }

            const results: any[] = [];
            for (const template of templates) {
                // Check if already subscribed
                const existing = await tx.fee.findFirst({
                    where: {
                        studentId: dto.studentId,
                        title: template.title,
                        amount: template.amount,
                        dueDate: new Date(dto.dueDate || template.dueDate),
                    }
                });

                if (existing) {
                    // Skip if already exists to prevent duplicate (or throw error if strict)
                    // The user asked to "check if fee is add not add for second time", implying idempotency is preferred over error, 
                    // but usually feedback is good. Let's skip and maybe inform.
                    // However, returning a result that implies success might be misleading if we skip.
                    // Use case: user clicks confirm twice. We should just return the existing one or skip.
                    // For now, let's skip but add to results so front end thinks it's processed (idempotent).
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
                        lines: {
                            create: [
                                {
                                    lineNumber: 1,
                                    compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                                    debit: template.amount,
                                    credit: 0,
                                },
                                {
                                    lineNumber: 2,
                                    compteId: template.compteId || this.INCOME_ACCOUNT_ID,
                                    debit: 0,
                                    credit: template.amount,
                                },
                            ],
                        },
                    },
                });
                results.push(studentFee);
            }
            return results;
        });
    }

    async subscribeAll(templateId: number, dueDate: string) {
        return this.prisma.$transaction(async (tx) => {
            const template = await tx.fee.findUnique({ where: { id: templateId } });
            if (!template) throw new NotFoundException('Template not found');

            const students = await tx.student.findMany({ select: { studentId: true } });
            
            const results: any[] = [];
            for (const student of students) {
                const studentFee = await tx.fee.create({
                    data: {
                        title: template.title,
                        amount: template.amount,
                        dueDate: new Date(dueDate),
                        description: template.description,
                        studentId: student.studentId,
                        compteId: template.compteId,
                        dateStartConsommation: template.dateStartConsommation,
                        dateEndConsommation: template.dateEndConsommation,
                    },
                });

                await tx.journalEntry.create({
                    data: {
                        journalId: this.GENERAL_JOURNAL_ID,
                        entryNumber: `BULK-${studentFee.id}-${Date.now()}`,
                        referenceType: 'STUDENT_FEE',
                        referenceId: studentFee.id,
                        description: `Bulk Fee: ${template.title} for Student #${student.studentId}`,
                        totalDebit: template.amount,
                        totalCredit: template.amount,
                        status: JournalEntryStatus.POSTED,
                        createdBy: 1,
                        lines: {
                            create: [
                                {
                                    lineNumber: 1,
                                    compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                                    debit: template.amount,
                                    credit: 0,
                                },
                                {
                                    lineNumber: 2,
                                    compteId: template.compteId || this.INCOME_ACCOUNT_ID,
                                    debit: 0,
                                    credit: template.amount,
                                },
                            ],
                        },
                    },
                });
                results.push(studentFee);
            }
            return results;
        });
    }

    async createManualFee(dto: CreateFeeDto) {
        // Check for duplicate fee
        const existingFee = await this.prisma.fee.findFirst({
            where: {
                studentId: dto.studentId,
                title: dto.title,
                amount: dto.amount,
                dueDate: new Date(dto.dueDate),
            }
        });

        if (existingFee) {
            throw new BadRequestException('A fee with this title, amount and due date already exists for this student.');
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
                    dateStartConsommation: dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : null,
                    dateEndConsommation: dto.dateEndConsommation ? new Date(dto.dateEndConsommation) : null,
                }
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
                    lines: {
                        create: [
                            {
                                lineNumber: 1,
                                compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                                debit: dto.amount,
                                credit: 0,
                            },
                            {
                                lineNumber: 2,
                                compteId: dto.compteId || this.INCOME_ACCOUNT_ID,
                                debit: 0,
                                credit: dto.amount,
                            },
                        ],
                    },
                },
            });
            return fee;
        });
    }

    async getStudentFees(studentId: number) {
        return this.prisma.fee.findMany({
            where: { studentId },
            include: {
                payments: true,
            },
            orderBy: {
                dueDate: 'asc',
            },
        });
    }

    async getPendingFees(studentId: number) {
        const fees = await this.prisma.fee.findMany({
            where: { studentId },
            include: {
                payments: true,
            },
        });

        return fees.map(fee => {
            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = Number(fee.amount) - totalPaid;
            return {
                ...fee,
                totalPaid,
                remaining,
            };
        }).filter(fee => fee.remaining > 0);
    }

    async getStudentFinancialStatus(studentId: number) {
        const fees = await this.prisma.fee.findMany({
            where: { studentId },
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
            const feePaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
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

    async deleteFee(id: number) {
        return this.prisma.fee.delete({
            where: { id },
        });
    }
}
