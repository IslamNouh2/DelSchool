import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { JournalEntryStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
    constructor(private prisma: PrismaService) { }

    private readonly STUDENT_RECEIVABLE_ACCOUNT_ID = 4; // Placeholder
    private readonly CASH_JOURNAL_ID = 2; // CASH
    private readonly BANK_JOURNAL_ID = 3; // BANK

    async collect(dto: CollectPaymentDto) {
        return this.prisma.$transaction(async (tx) => {
            const fee = await tx.fee.findUnique({
                where: { id: dto.feeId },
                include: { payments: true },
            });

            if (!fee) {
                throw new BadRequestException('Fee not found');
            }

            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = Number(fee.amount) - totalPaid;

            if (dto.amount > remaining) {
                throw new BadRequestException(`Payment exceeds remaining balance (${remaining})`);
            }

            // 1. Validate Account
            if (!dto.compteId) {
                throw new BadRequestException('Destination account (Caisse/Bank) is required');
            }
            const destinationAccountId = dto.compteId;

            // 2. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    amount: dto.amount,
                    method: dto.method as any || 'CASH',
                    transactionId: dto.reference,
                    description: dto.description,
                    feeId: dto.feeId,
                    studentId: fee.studentId,
                    compteId: destinationAccountId,
                },
            });

            // 3. Determine Journal
            const isCash = dto.method === 'CASH';
            const journalId = isCash ? this.CASH_JOURNAL_ID : this.BANK_JOURNAL_ID;

            // 4. Generate Journal Entry
            await tx.journalEntry.create({
                data: {
                    journalId: journalId,
                    entryNumber: `PAY-${payment.id}-${Date.now()}`,
                    // ... rest is same
                    referenceType: 'STUDENT_PAYMENT',
                    referenceId: payment.id,
                    description: `Payment for Fee #${fee.id} from Student #${fee.studentId}`,
                    totalDebit: dto.amount,
                    totalCredit: dto.amount,
                    status: JournalEntryStatus.POSTED,
                    createdBy: 1,
                    lines: {
                        create: [
                            {
                                lineNumber: 1,
                                compteId: destinationAccountId,
                                debit: dto.amount,
                                credit: 0,
                            },
                            {
                                lineNumber: 2,
                                compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                                debit: 0,
                                credit: dto.amount,
                            },
                        ],
                    },
                },
            });

            return payment;
        });
    }

    async getFeePayments(feeId: number) {
        return this.prisma.payment.findMany({
            where: { feeId },
            orderBy: { date: 'desc' },
        });
    }

    async getStudentHistory(studentId: number) {
        const [fees, payments] = await Promise.all([
            this.prisma.fee.findMany({
                where: { studentId },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payment.findMany({
                where: { studentId },
                orderBy: { date: 'desc' },
            }),
        ]);

        // Merge and sort for timeline
        const history = [
            ...fees.map(f => ({ type: 'FEE', date: f.createdAt, amount: f.amount, title: f.title, id: f.id })),
            ...payments.map(p => ({ type: 'PAYMENT', date: p.date, amount: p.amount, method: p.method, id: p.id })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return history;
    }
}
