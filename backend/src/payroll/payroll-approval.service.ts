import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus } from '@prisma/client';
import { CompteService } from '../compte/compte.service';

@Injectable()
export class PayrollApprovalService {
  constructor(
    private prisma: PrismaService,
    private compteService: CompteService,
  ) {}

  /**
   * Approves a payroll, creates an expense, and logs the action.
   * Only ADMIN can approve.
   */
  async approvePayroll(tenantId: string, payrollId: number, adminId: number) {
    // 1. Verify user is ADMIN (should be handled by Guard, but we check for safety/audit)
    const admin = await this.prisma.user.findFirst({
      where: { id: adminId, tenantId },
      include: { role: true },
    });
    if (!admin || admin.role?.name !== 'ADMIN') {
      throw new ForbiddenException('Only admins can approve payroll');
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. Fetch Payroll
      const payroll = await tx.payroll.findFirst({
        where: { id: payrollId, tenantId }, // Enforce tenant
        include: { employer: true },
      });

      if (!payroll) throw new BadRequestException('Payroll record not found');
      if (
        payroll.status !== PayrollStatus.DRAFT &&
        payroll.status !== PayrollStatus.SUBMITTED
      ) {
        throw new BadRequestException(
          'Payroll is already processed or in an invalid state for approval',
        );
      }

      // 3. Determine Expense Account (Compte)
      let expenseAccountId = payroll.compteId;

      if (!expenseAccountId) {
        // Try to get or create employer account
        try {
          const employerCompte =
            await this.compteService.getOrCreateEmployerAccount(
              tenantId, // Pass tenantId
              payroll.employerId,
              `${payroll.employer.firstName} ${payroll.employer.lastName}`,
            );
          expenseAccountId = employerCompte.id;
        } catch (error) {
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
          if (salaryAccount) expenseAccountId = salaryAccount.id;
        }
      }

      if (!expenseAccountId) {
        throw new BadRequestException(
          'Could not determine Expense Account for this payroll',
        );
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
          status: PayrollStatus.APPROVED,
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
            newStatus: PayrollStatus.APPROVED,
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
  async submitPayroll(tenantId: string, payrollId: number, userId: number) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id: payrollId, tenantId },
    });
    if (!payroll) throw new BadRequestException('Payroll not found');
    if (payroll.status !== PayrollStatus.DRAFT)
      throw new BadRequestException('Only DRAFT payroll can be submitted');

    return this.prisma.payroll.update({
      where: { id: payrollId },
      data: { status: PayrollStatus.SUBMITTED },
    });
  }
}
