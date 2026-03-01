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
exports.PayrollApprovalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const client_1 = require("@prisma/client");
const compte_service_1 = require("../compte/compte.service");
let PayrollApprovalService = class PayrollApprovalService {
    prisma;
    compteService;
    constructor(prisma, compteService) {
        this.prisma = prisma;
        this.compteService = compteService;
    }
    /**
     * Approves a payroll, creates an expense, and logs the action.
     * Only ADMIN can approve.
     */
    async approvePayroll(tenantId, payrollId, adminId) {
        // 1. Verify user is ADMIN (should be handled by Guard, but we check for safety/audit)
        const admin = await this.prisma.user.findFirst({ where: { id: adminId, tenantId } });
        if (!admin || admin.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can approve payroll');
        }
        return this.prisma.$transaction(async (tx) => {
            // 2. Fetch Payroll
            const payroll = await tx.payroll.findFirst({
                where: { id: payrollId, tenantId }, // Enforce tenant
                include: { employer: true },
            });
            if (!payroll)
                throw new common_1.BadRequestException('Payroll record not found');
            if (payroll.status !== client_1.PayrollStatus.DRAFT && payroll.status !== client_1.PayrollStatus.SUBMITTED) {
                throw new common_1.BadRequestException('Payroll is already processed or in an invalid state for approval');
            }
            // 3. Determine Expense Account (Compte)
            let expenseAccountId = payroll.compteId;
            if (!expenseAccountId) {
                // Try to get or create employer account
                try {
                    const employerCompte = await this.compteService.getOrCreateEmployerAccount(tenantId, // Pass tenantId
                    payroll.employerId, `${payroll.employer.firstName} ${payroll.employer.lastName}`);
                    expenseAccountId = employerCompte.id;
                }
                catch (error) {
                    // Fallback to searching for a general Salary Expense account
                    const salaryAccount = await tx.compte.findFirst({
                        where: {
                            tenantId, // Enforce tenant
                            OR: [
                                { code: { startsWith: '63' } },
                                { name: { contains: 'Salaire', mode: 'insensitive' } },
                                { name: { contains: 'Salary', mode: 'insensitive' } },
                            ],
                        },
                    });
                    if (salaryAccount)
                        expenseAccountId = salaryAccount.id;
                }
            }
            if (!expenseAccountId) {
                throw new common_1.BadRequestException('Could not determine Expense Account for this payroll');
            }
            // 4. Create Expense
            const expense = await tx.expense.create({
                data: {
                    title: `Salary Expense - ${payroll.employer.firstName} ${payroll.employer.lastName}`,
                    category: 'Salaires',
                    amount: payroll.netSalary,
                    expenseDate: new Date(),
                    description: `Payroll for period ${payroll.period_start.toISOString().split('T')[0]} to ${payroll.period_end.toISOString().split('T')[0]}`,
                    isPaid: false, // Will be marked as paid when the payment is actually made
                    compteId: expenseAccountId,
                    tenantId, // Enforce tenant
                },
            });
            // 5. Update Payroll Status
            const updatedPayroll = await tx.payroll.update({
                where: { id: payrollId, tenantId },
                data: {
                    status: client_1.PayrollStatus.APPROVED,
                    compteId: expenseAccountId,
                },
            });
            // 6. Audit Log
            await tx.auditLog.create({
                data: {
                    action: 'APPROVE',
                    entity: 'Payroll',
                    entityId: payrollId,
                    userId: adminId,
                    details: {
                        previousStatus: payroll.status,
                        newStatus: client_1.PayrollStatus.APPROVED,
                        expenseId: expense.id,
                        amount: payroll.netSalary.toString(),
                    },
                    tenantId, // Enforce tenant
                },
            });
            return { payroll: updatedPayroll, expense };
        });
    }
    /**
     * Submits a payroll for approval (e.g., from HR/Accountant role if applicable)
     */
    async submitPayroll(tenantId, payrollId, userId) {
        const payroll = await this.prisma.payroll.findFirst({ where: { id: payrollId, tenantId } });
        if (!payroll)
            throw new common_1.BadRequestException('Payroll not found');
        if (payroll.status !== client_1.PayrollStatus.DRAFT)
            throw new common_1.BadRequestException('Only DRAFT payroll can be submitted');
        return this.prisma.payroll.update({
            where: { id: payrollId },
            data: { status: client_1.PayrollStatus.SUBMITTED },
        });
    }
};
exports.PayrollApprovalService = PayrollApprovalService;
exports.PayrollApprovalService = PayrollApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, compte_service_1.CompteService])
], PayrollApprovalService);
