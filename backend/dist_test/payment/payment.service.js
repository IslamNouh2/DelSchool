"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentService = class PaymentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    STUDENT_RECEIVABLE_ACCOUNT_ID = 4; // Placeholder
    CASH_JOURNAL_ID = 2; // CASH
    BANK_JOURNAL_ID = 3; // BANK
    async collect(dto) {
        return this.prisma.$transaction(async (tx) => {
            const fee = await tx.fee.findUnique({
                where: { id: dto.feeId },
                include: { payments: true },
            });
            if (!fee) {
                throw new common_1.BadRequestException('Fee not found');
            }
            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = Number(fee.amount) - totalPaid;
            if (dto.amount > remaining) {
                throw new common_1.BadRequestException(`Payment exceeds remaining balance (${remaining})`);
            }
            // 1. Validate Account
            if (!dto.compteId) {
                throw new common_1.BadRequestException('Destination account (Caisse/Bank) is required');
            }
            const destinationAccountId = dto.compteId;
            // 2. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    amount: dto.amount,
                    method: dto.method || 'CASH',
                    transactionId: dto.reference,
                    description: dto.description,
                    feeId: dto.feeId,
                    studentId: fee.studentId,
                    compteId: destinationAccountId,
                    tenantId: fee.tenantId,
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
                    status: client_1.JournalEntryStatus.POSTED,
                    createdBy: 1,
                    tenantId: fee.tenantId,
                    lines: {
                        create: [
                            {
                                lineNumber: 1,
                                compteId: destinationAccountId,
                                debit: dto.amount,
                                credit: 0,
                                tenantId: fee.tenantId,
                            },
                            {
                                lineNumber: 2,
                                compteId: this.STUDENT_RECEIVABLE_ACCOUNT_ID,
                                debit: 0,
                                credit: dto.amount,
                                tenantId: fee.tenantId,
                            },
                        ],
                    },
                },
            });
            return payment;
        });
    }
    async getFeePayments(feeId) {
        return this.prisma.payment.findMany({
            where: { feeId },
            orderBy: { date: 'desc' },
        });
    }
    async getStudentHistory(studentId) {
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
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PaymentService);
