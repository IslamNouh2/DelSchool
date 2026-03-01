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
exports.ExpenseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
let ExpenseService = class ExpenseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        return this.prisma.$transaction(async (tx) => {
            let realStart = dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : null;
            if (dto.isAmortization) {
                realStart = new Date(dto.expenseDate); // If amortization, start date is purchase date
            }
            // 2. Create Expense
            const expense = await tx.expense.create({
                data: {
                    title: dto.title,
                    amount: dto.amount,
                    category: dto.category,
                    expenseDate: new Date(dto.expenseDate),
                    description: dto.description,
                    isAmortization: dto.isAmortization,
                    dateStartConsommation: realStart ? new Date(realStart) : null,
                    dateEndConsommation: dto.dateEndConsommation ? new Date(dto.dateEndConsommation) : null,
                    compteId: dto.compteId, // Expense Account
                    isPaid: !!dto.payment, // Mark as paid if payment info exists
                    tenantId, // Enforce tenant
                },
            });
            // 3. Handle Payment (if provided)
            if (dto.payment) {
                if (!dto.payment.treasuryId) {
                    throw new common_1.BadRequestException("Treasury account is required for payment");
                }
                // Create Payment Record linked to Source (Treasury) and Destination (Expense Account)
                const payment = await tx.payment.create({
                    data: {
                        amount: Number(dto.amount),
                        method: dto.payment.method || 'CASH',
                        date: new Date(dto.expenseDate), // Payment date = Expense date usually
                        status: 'COMPLETED',
                        expenseId: expense.id,
                        compteId: dto.payment.treasuryId, // Legacy field
                        compteSourceId: dto.payment.treasuryId, // Source
                        compteDestId: dto.compteId, // Destination
                        description: `Expense Payment: ${dto.title}`,
                        tenantId, // Enforce tenant
                    }
                });
                // Create Journal Entry
                // Debit: Expense Account (compteId)
                // Credit: Treasury Account (payment.treasuryId)
                if (dto.compteId) {
                    const journalId = dto.payment.method === 'CASH' ? 2 : 3;
                    await tx.journalEntry.create({
                        data: {
                            journalId,
                            entryNumber: `EXP-${expense.id}-${Date.now()}`,
                            referenceType: 'EXPENSE_PAYMENT',
                            referenceId: expense.id,
                            date: new Date(dto.expenseDate),
                            description: `Paiement Dépense: ${dto.title}`,
                            totalDebit: Number(dto.amount),
                            totalCredit: Number(dto.amount),
                            status: 'POSTED',
                            createdBy: 1,
                            tenantId, // Enforce tenant
                            lines: {
                                create: [
                                    {
                                        lineNumber: 1,
                                        compteId: dto.compteId, // Debit Expense
                                        debit: Number(dto.amount),
                                        credit: 0,
                                        description: dto.title,
                                        tenantId, // Enforce tenant
                                    },
                                    {
                                        lineNumber: 2,
                                        compteId: dto.payment.treasuryId, // Credit Treasury
                                        debit: 0,
                                        credit: Number(dto.amount),
                                        description: `Paiement: ${dto.title}`,
                                        tenantId, // Enforce tenant
                                    }
                                ]
                            }
                        }
                    });
                }
            }
            return expense;
        });
    }
    async findAll(tenantId, page = 1, limit = 10, search) {
        const skip = (page - 1) * limit;
        const where = {
            tenantId, // Enforce tenant
            category: {
                not: 'Salaires'
            }
        };
        if (search) {
            where.AND = [
                { tenantId }, // Enforce tenant
                { category: { not: 'Salaires' } },
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { category: { contains: search, mode: 'insensitive' } },
                    ]
                }
            ];
        }
        const [expenses, total] = await this.prisma.$transaction([
            this.prisma.expense.findMany({
                where,
                orderBy: { expenseDate: 'desc' },
                include: {
                    compte: true
                },
                skip,
                take: limit,
            }),
            this.prisma.expense.count({ where }),
        ]);
        return {
            expenses,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(tenantId, id) {
        return this.prisma.expense.findUnique({
            where: { id, tenantId }, // Enforce tenant
            include: { compte: true }
        });
    }
    async update(tenantId, id, dto) {
        return this.prisma.expense.update({
            where: { id, tenantId }, // Enforce tenant
            data: {
                ...dto,
                expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
                dateStartConsommation: dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : undefined,
                dateEndConsommation: dto.dateEndConsommation ? new Date(dto.dateEndConsommation) : undefined,
            },
        });
    }
    async remove(tenantId, id) {
        return this.prisma.expense.delete({
            where: { id, tenantId } // Enforce tenant
        });
    }
    async pay(tenantId, id, payload) {
        return this.prisma.$transaction(async (tx) => {
            const expense = await tx.expense.findUnique({ where: { id, tenantId } }); // Enforce tenant
            if (!expense)
                throw new common_1.BadRequestException('Expense not found');
            if (expense.isPaid)
                throw new common_1.BadRequestException('Expense already paid');
            if (!payload.treasuryId)
                throw new common_1.BadRequestException('Treasury account required');
            // Create Payment
            const payment = await tx.payment.create({
                data: {
                    amount: Number(expense.amount),
                    method: payload.method, // Cast to verify against schema if needed
                    date: new Date(),
                    status: 'COMPLETED',
                    expenseId: expense.id,
                    compteId: payload.treasuryId,
                    compteSourceId: payload.treasuryId,
                    compteDestId: expense.compteId,
                    description: `Paiement Dépense: ${expense.title}`,
                    tenantId, // Enforce tenant
                }
            });
            // Create Journal Entry
            if (expense.compteId) {
                const journalId = payload.method === 'CASH' ? 2 : 3;
                await tx.journalEntry.create({
                    data: {
                        journalId,
                        entryNumber: `EXP-PAY-${expense.id}-${Date.now()}`,
                        referenceType: 'EXPENSE_PAYMENT',
                        referenceId: payment.id,
                        date: new Date(),
                        description: `Paiement Dépense: ${expense.title}`,
                        totalDebit: Number(expense.amount),
                        totalCredit: Number(expense.amount),
                        status: 'POSTED',
                        createdBy: 1,
                        tenantId, // Enforce tenant
                        lines: {
                            create: [
                                {
                                    lineNumber: 1,
                                    compteId: expense.compteId, // Debit Expense Account
                                    debit: Number(expense.amount),
                                    credit: 0,
                                    description: expense.title,
                                    tenantId, // Enforce tenant
                                },
                                {
                                    lineNumber: 2,
                                    compteId: payload.treasuryId, // Credit Treasury Account
                                    debit: 0,
                                    credit: Number(expense.amount),
                                    description: `Paiement: ${expense.title}`,
                                    tenantId, // Enforce tenant
                                }
                            ]
                        }
                    }
                });
            }
            // Update Expense
            return tx.expense.update({
                where: { id, tenantId }, // Enforce tenant
                data: { isPaid: true }
            });
        });
    }
};
exports.ExpenseService = ExpenseService;
exports.ExpenseService = ExpenseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ExpenseService);
