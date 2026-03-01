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
exports.FeeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const client_1 = require("@prisma/client");
let FeeService = class FeeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Constants for internal accounting (would ideally be configurable)
    STUDENT_RECEIVABLE_ACCOUNT_ID = 4; // Placeholder
    INCOME_ACCOUNT_ID = 5; // Placeholder
    GENERAL_JOURNAL_ID = 1; // Placeholder
    async createTemplate(tenantId, dto) {
        return this.prisma.fee.create({
            data: {
                title: dto.title,
                amount: dto.amount,
                dueDate: new Date(dto.dueDate),
                description: dto.description,
                compteId: dto.compteId,
                dateStartConsommation: dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : null,
                dateEndConsommation: dto.dateEndConsommation ? new Date(dto.dateEndConsommation) : null,
                tenantId,
            }
        });
    }
    async findAllTemplates(tenantId) {
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
    async subscribeStudent(tenantId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const templates = await tx.fee.findMany({
                where: {
                    id: { in: dto.templateIds },
                    tenantId,
                },
            });
            if (templates.length !== dto.templateIds.length) {
                throw new common_1.NotFoundException('Some fee templates not found');
            }
            const results = [];
            for (const template of templates) {
                // Check if already subscribed
                const existing = await tx.fee.findFirst({
                    where: {
                        studentId: dto.studentId,
                        title: template.title,
                        amount: template.amount,
                        dueDate: new Date(dto.dueDate || template.dueDate),
                        tenantId,
                    }
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
                        status: client_1.JournalEntryStatus.POSTED,
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
            return results;
        });
    }
    async subscribeAll(tenantId, templateId, dueDate) {
        return this.prisma.$transaction(async (tx) => {
            const template = await tx.fee.findUnique({ where: { id: templateId, tenantId } });
            if (!template)
                throw new common_1.NotFoundException('Template not found');
            const students = await tx.student.findMany({ where: { tenantId }, select: { studentId: true } });
            const results = [];
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
                        tenantId,
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
                        status: client_1.JournalEntryStatus.POSTED,
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
            return results;
        });
    }
    async createManualFee(tenantId, dto) {
        // Check for duplicate fee
        const existingFee = await this.prisma.fee.findFirst({
            where: {
                studentId: dto.studentId,
                title: dto.title,
                amount: dto.amount,
                dueDate: new Date(dto.dueDate),
                tenantId,
            }
        });
        if (existingFee) {
            throw new common_1.BadRequestException('A fee with this title, amount and due date already exists for this student.');
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
                    tenantId,
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
                    status: client_1.JournalEntryStatus.POSTED,
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
            return fee;
        });
    }
    async getStudentFees(tenantId, studentId) {
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
    async getPendingFees(tenantId, studentId) {
        const fees = await this.prisma.fee.findMany({
            where: { studentId, tenantId },
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
    async getStudentFinancialStatus(tenantId, studentId) {
        const fees = await this.prisma.fee.findMany({
            where: { studentId, tenantId },
            include: {
                payments: true,
            },
        });
        if (fees.length === 0)
            return 'UPCOMING';
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
        if (totalPaid >= totalDue)
            return 'PAID';
        if (hasOverdue)
            return 'OVERDUE';
        if (totalPaid > 0)
            return 'PARTIAL';
        return 'UPCOMING';
    }
    async deleteFee(tenantId, id) {
        return this.prisma.fee.delete({
            where: { id, tenantId },
        });
    }
};
exports.FeeService = FeeService;
exports.FeeService = FeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], FeeService);
