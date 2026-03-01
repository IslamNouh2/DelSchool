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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const compte_service_1 = require("../compte/compte.service");
const client_1 = require("@prisma/client");
const hr_calculation_service_1 = require("./hr-calculation.service");
const payroll_approval_service_1 = require("./payroll-approval.service");
let PayrollService = class PayrollService {
    prisma;
    compteService;
    hrCalculation;
    approvalService;
    constructor(prisma, compteService, hrCalculation, approvalService) {
        this.prisma = prisma;
        this.compteService = compteService;
        this.hrCalculation = hrCalculation;
        this.approvalService = approvalService;
    }
    async create(tenantId, createPayrollDto) {
        return this.prisma.payroll.create({
            data: {
                employerId: createPayrollDto.employerId,
                period_start: new Date(createPayrollDto.period_start),
                period_end: new Date(createPayrollDto.period_end),
                baseSalary: createPayrollDto.baseSalary,
                allowances: createPayrollDto.allowances || 0,
                deductions: createPayrollDto.deductions || 0,
                netSalary: createPayrollDto.netSalary,
                status: client_1.PayrollStatus.DRAFT,
                tenantId, // Enforce tenant
            },
        });
    }
    async findAll(tenantId, start, end) {
        const where = { tenantId }; // Enforce tenant
        if (start && end) {
            where.period_start = { gte: new Date(start) };
            where.period_end = { lte: new Date(end) };
        }
        return this.prisma.payroll.findMany({
            where,
            include: {
                employer: {
                    select: {
                        employerId: true,
                        firstName: true,
                        lastName: true,
                        code: true,
                        photoFileName: true,
                        salary: true,
                    }
                },
                compte: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        return this.prisma.payroll.findFirst({
            where: { id, tenantId }, // Enforce tenant
            include: {
                employer: true,
            },
        });
    }
    async findByEmployerId(tenantId, employerId) {
        return this.prisma.payroll.findMany({
            where: { employerId, tenantId }, // Enforce tenant
            include: {
                compte: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: { period_end: 'desc' },
        });
    }
    /**
     * Delegates approval to PayrollApprovalService
     */
    async approvePayroll(tenantId, id, adminId) {
        return this.approvalService.approvePayroll(tenantId, id, adminId);
    }
    /**
     * Delegates submission to PayrollApprovalService
     */
    async submitPayroll(tenantId, id, userId) {
        return this.approvalService.submitPayroll(tenantId, id, userId);
    }
    async payPayroll(tenantId, id, paymentMethod = 'CASH', compteId, expenseAccountIdOverride) {
        // Validate Treasury Account
        if (compteId) {
            const account = await this.prisma.compte.findFirst({
                where: { id: compteId, tenantId }, // Enforce tenant
                select: { category: true, name: true }
            });
            if (!account) {
                throw new Error('Treasury account not found');
            }
            if (!['CAISSE', 'BANQUE'].includes(account.category)) {
                throw new Error(`Invalid treasury account: ${account.name} is not a Caisse or Banque.`);
            }
        }
        return this.prisma.$transaction(async (tx) => {
            const payroll = await tx.payroll.findFirst({
                where: { id, tenantId }, // Enforce tenant
                include: { employer: true }
            });
            if (!payroll)
                throw new common_1.BadRequestException('Payroll record not found');
            if (payroll.status === client_1.PayrollStatus.PAID)
                throw new common_1.BadRequestException('Payroll already paid');
            if (payroll.status !== client_1.PayrollStatus.APPROVED) {
                throw new common_1.BadRequestException('Only APPROVED payroll can be paid');
            }
            // 1. Determine Expense Account (Destination)
            let expenseAccountId = payroll.compteId || 0;
            if (expenseAccountId === 0) {
                if (expenseAccountIdOverride) {
                    expenseAccountId = expenseAccountIdOverride;
                }
                else {
                    const employerAccount = await this.compteService.getOrCreateEmployerAccount(tenantId, // Pass tenantId
                    payroll.employerId, `${payroll.employer.firstName} ${payroll.employer.lastName}`);
                    expenseAccountId = employerAccount.id;
                }
            }
            if (expenseAccountId === 0) {
                throw new common_1.BadRequestException('Could not determine Expense Account for this payroll.');
            }
            // 2. We already created an Expense during Approval. 
            // We should find it or update it. 
            // In the original code it created a NEW expense. 
            // Ideally, Approval creates the Expense (Accrual), and Pay marks it as paid and creates the movement.
            const existingExpense = await tx.expense.findFirst({
                where: {
                    title: { contains: `Payroll for period ${payroll.period_start.toISOString().split('T')[0]}` },
                    compteId: expenseAccountId,
                    amount: payroll.netSalary,
                    tenantId, // Enforce tenant
                }
            });
            const expenseId = existingExpense?.id;
            // 3. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    amount: Number(payroll.netSalary),
                    method: paymentMethod,
                    date: new Date(),
                    status: 'COMPLETED',
                    employerId: payroll.employerId,
                    expenseId: expenseId,
                    compteSourceId: compteId, // Source (Treasury)
                    compteDestId: expenseAccountId, // Destination (Expense)
                    description: `Salary Payment #${payroll.id}`,
                    tenantId, // Enforce tenant
                }
            });
            // 4. Create Journal Entry (Accounting)
            if (compteId) {
                const journalId = paymentMethod === 'CASH' ? 2 : 3;
                await tx.journalEntry.create({
                    data: {
                        journalId,
                        entryNumber: `PAY-${payment.id}-${Date.now()}`,
                        referenceType: 'PAYROLL_PAYMENT',
                        referenceId: payment.id,
                        date: new Date(),
                        description: `Paiement Salaire: ${payroll.employer.firstName} ${payroll.employer.lastName}`,
                        totalDebit: Number(payroll.netSalary),
                        totalCredit: Number(payroll.netSalary),
                        status: 'POSTED',
                        createdBy: 1,
                        tenantId, // Enforce tenant
                        lines: {
                            create: [
                                {
                                    lineNumber: 1,
                                    compteId: expenseAccountId,
                                    debit: Number(payroll.netSalary),
                                    credit: 0,
                                    description: `Salaire ${payroll.employer.firstName} ${payroll.employer.lastName}`,
                                    tenantId, // Enforce tenant
                                },
                                {
                                    lineNumber: 2,
                                    compteId: compteId,
                                    debit: 0,
                                    credit: Number(payroll.netSalary),
                                    description: `Paiement Salaire: ${payroll.employer.firstName} ${payroll.employer.lastName}`,
                                    tenantId, // Enforce tenant
                                }
                            ]
                        }
                    }
                });
            }
            // 5. Update Payroll Record
            const updatedPayroll = await tx.payroll.update({
                where: { id }, // id is unique globally but we already checked tenantId above
                data: {
                    status: client_1.PayrollStatus.PAID,
                },
                include: {
                    employer: true,
                    compte: true
                }
            });
            return { payment, payroll: updatedPayroll };
        });
    }
    async update(tenantId, id, updatePayrollDto) {
        const { period_start, period_end, ...rest } = updatePayrollDto;
        const data = { ...rest };
        if (period_start)
            data.period_start = new Date(period_start);
        if (period_end)
            data.period_end = new Date(period_end);
        // Recalculate net salary if components change
        if (updatePayrollDto.baseSalary !== undefined ||
            updatePayrollDto.allowances !== undefined ||
            updatePayrollDto.deductions !== undefined) {
            const payroll = await this.prisma.payroll.findFirst({ where: { id, tenantId } }); // Enforce tenant
            if (!payroll)
                throw new common_1.BadRequestException('Payroll not found');
            const base = updatePayrollDto.baseSalary !== undefined ? updatePayrollDto.baseSalary : Number(payroll.baseSalary);
            const allowances = updatePayrollDto.allowances !== undefined ? updatePayrollDto.allowances : Number(payroll.allowances);
            const deductions = updatePayrollDto.deductions !== undefined ? updatePayrollDto.deductions : Number(payroll.deductions);
            data.netSalary = base + allowances - deductions;
        }
        return this.prisma.payroll.update({
            where: { id },
            data,
        });
    }
    async remove(tenantId, id) {
        // Check tenant first
        const check = await this.prisma.payroll.findFirst({ where: { id, tenantId } });
        if (!check)
            throw new common_1.BadRequestException('Payroll not found');
        return this.prisma.payroll.delete({
            where: { id },
        });
    }
    // logic: 1 day absent = (baseSalary / 30) deduction (assuming 30 days month or actual days)
    async generatePayroll(tenantId, dto) {
        const start = new Date(dto.period_start);
        const end = new Date(dto.period_end);
        // 1. Get employers (all or specific)
        const where = { okBlock: false, tenantId }; // Enforce tenant
        if (dto.employerId) {
            where.employerId = Number(dto.employerId);
        }
        const employers = await this.prisma.employer.findMany({
            where, // Only active employers
        });
        const generatedPayrolls = [];
        for (const emp of employers) {
            // Check if payroll already exists for this period
            const existing = await this.prisma.payroll.findFirst({
                where: {
                    employerId: emp.employerId,
                    period_start: start,
                    period_end: end,
                    tenantId, // Enforce tenant
                }
            });
            if (existing) {
                continue; // Skip if exists
            }
            // 2. Fetch attendance
            const attendance = await this.prisma.employerAttendance.findMany({
                where: {
                    employerId: emp.employerId,
                    date: {
                        gte: start,
                        lte: end,
                    },
                    tenantId, // Enforce tenant
                },
            });
            // Use HRCalculationService for logic
            const calc = await this.hrCalculation.calculateSalary(emp.salary, attendance, dto.allowances || 0, emp.salaryBasis // Pass the new salaryBasis field
            );
            const payroll = await this.prisma.payroll.create({
                data: {
                    employerId: emp.employerId,
                    period_start: start,
                    period_end: end,
                    baseSalary: calc.baseSalary,
                    allowances: calc.allowances,
                    deductions: calc.totalDeduction,
                    netSalary: calc.netSalary,
                    status: client_1.PayrollStatus.DRAFT,
                    attendanceSummary: calc.attendanceSummary,
                    compteId: dto.compteId ? Number(dto.compteId) : undefined,
                    createdAt: dto.date ? new Date(dto.date) : new Date(),
                    tenantId, // Enforce tenant
                }
            });
            generatedPayrolls.push(payroll);
        }
        return { count: generatedPayrolls.length, generatedPayrolls };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, compte_service_1.CompteService,
        hr_calculation_service_1.HRCalculationService,
        payroll_approval_service_1.PayrollApprovalService])
], PayrollService);
