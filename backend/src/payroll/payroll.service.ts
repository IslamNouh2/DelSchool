import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CompteService } from '../compte/compte.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { AttendanceStatus, PayrollStatus, Prisma, Payroll } from '@prisma/client';
import { HRCalculationService } from './hr-calculation.service';
import { PayrollApprovalService } from './payroll-approval.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private compteService: CompteService,
    private hrCalculation: HRCalculationService,
    private approvalService: PayrollApprovalService,
  ) {}

  async create(createPayrollDto: CreatePayrollDto) {
    return this.prisma.payroll.create({
      data: {
        employerId: createPayrollDto.employerId,
        period_start: new Date(createPayrollDto.period_start),
        period_end: new Date(createPayrollDto.period_end),
        baseSalary: createPayrollDto.baseSalary,
        allowances: createPayrollDto.allowances || 0,
        deductions: createPayrollDto.deductions || 0,
        netSalary: createPayrollDto.netSalary,
        status: PayrollStatus.DRAFT,
      },
    });
  }

  async findAll(start?: string, end?: string) {
    const where: Prisma.PayrollWhereInput = {};
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

  async findOne(id: number) {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employer: true,
      },
    });
  }

  async findByEmployerId(employerId: number) {
    return this.prisma.payroll.findMany({
      where: { employerId },
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
  async approvePayroll(id: number, adminId: number) {
    return this.approvalService.approvePayroll(id, adminId);
  }

  /**
   * Delegates submission to PayrollApprovalService
   */
  async submitPayroll(id: number, userId: number) {
    return this.approvalService.submitPayroll(id, userId);
  }

  async payPayroll(id: number, paymentMethod: string = 'CASH', compteId?: number, expenseAccountIdOverride?: number) {

        // Validate Treasury Account
        if (compteId) {
            const account = await this.prisma.compte.findUnique({
                where: { id: compteId },
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
            const payroll = await tx.payroll.findUnique({
                where: { id },
                include: { employer: true }
            });

            if (!payroll) throw new BadRequestException('Payroll record not found');
            if (payroll.status === PayrollStatus.PAID) throw new BadRequestException('Payroll already paid');
            if (payroll.status !== PayrollStatus.APPROVED) {
              throw new BadRequestException('Only APPROVED payroll can be paid');
            }

            // 1. Determine Expense Account (Destination)
            let expenseAccountId = payroll.compteId || 0;

            if (expenseAccountId === 0) {
                if (expenseAccountIdOverride) {
                    expenseAccountId = expenseAccountIdOverride;
                } else {
                    const employerAccount = await this.compteService.getOrCreateEmployerAccount(
                        payroll.employerId, 
                        `${payroll.employer.firstName} ${payroll.employer.lastName}`
                    );
                    expenseAccountId = employerAccount.id;
                }
            }
            
            if (expenseAccountId === 0) {
                 throw new BadRequestException('Could not determine Expense Account for this payroll.');
            }

            // 2. We already created an Expense during Approval. 
            // We should find it or update it. 
            // In the original code it created a NEW expense. 
            // Ideally, Approval creates the Expense (Accrual), and Pay marks it as paid and creates the movement.
            
            const existingExpense = await tx.expense.findFirst({
              where: {
                title: { contains: `Payroll for period ${payroll.period_start.toISOString().split('T')[0]}` },
                compteId: expenseAccountId,
                amount: payroll.netSalary
              }
            });

            const expenseId = existingExpense?.id;

            // 3. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    amount: Number(payroll.netSalary),
                    method: paymentMethod as any,
                    date: new Date(),
                    status: 'COMPLETED',
                    employerId: payroll.employerId,
                    expenseId: expenseId,
                    compteSourceId: compteId, // Source (Treasury)
                    compteDestId: expenseAccountId, // Destination (Expense)
                    description: `Salary Payment #${payroll.id}`
                } as any
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
                        lines: {
                            create: [
                                {
                                    lineNumber: 1,
                                    compteId: expenseAccountId,
                                    debit: Number(payroll.netSalary),
                                    credit: 0,
                                    description: `Salaire ${payroll.employer.firstName} ${payroll.employer.lastName}`
                                },
                                {
                                    lineNumber: 2,
                                    compteId: compteId,
                                    debit: 0,
                                    credit: Number(payroll.netSalary),
                                    description: `Paiement Salaire: ${payroll.employer.firstName} ${payroll.employer.lastName}`
                                }
                            ]
                        }
                    }
                });
            }

            // 5. Update Payroll Record
            const updatedPayroll = await tx.payroll.update({
                where: { id },
                data: { 
                    status: PayrollStatus.PAID,
                },
                include: {
                    employer: true,
                    compte: true
                }
            });

            return { payment, payroll: updatedPayroll };
        });
  }

  async update(id: number, updatePayrollDto: UpdatePayrollDto) {
    const { period_start, period_end, ...rest } = updatePayrollDto;
    const data: Prisma.PayrollUpdateInput = { ...rest };
    
    if (period_start) data.period_start = new Date(period_start);
    if (period_end) data.period_end = new Date(period_end);

    // Recalculate net salary if components change
    if (
        updatePayrollDto.baseSalary !== undefined || 
        updatePayrollDto.allowances !== undefined || 
        updatePayrollDto.deductions !== undefined
    ) {
        const payroll = await this.prisma.payroll.findUnique({ where: { id } });
        if (!payroll) throw new BadRequestException('Payroll not found');

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

  async remove(id: number) {
    return this.prisma.payroll.delete({
      where: { id },
    });
  }

  // logic: 1 day absent = (baseSalary / 30) deduction (assuming 30 days month or actual days)
  async generatePayroll(dto: GeneratePayrollDto) {
    const start = new Date(dto.period_start);
    const end = new Date(dto.period_end);

    // 1. Get employers (all or specific)
    const where: Prisma.EmployerWhereInput = { okBlock: false };
    if (dto.employerId) {
        where.employerId = Number(dto.employerId);
    }

    const employers = await this.prisma.employer.findMany({
        where, // Only active employers
    });

    const generatedPayrolls: Payroll[] = [];

    for (const emp of employers) {
        // Check if payroll already exists for this period
        const existing = await this.prisma.payroll.findFirst({
            where: {
                employerId: emp.employerId,
                period_start: start,
                period_end: end,
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
            },
        });

        // Use HRCalculationService for logic
        const calc = await this.hrCalculation.calculateSalary(
            emp.salary,
            attendance,
            dto.allowances || 0,
            emp.salaryBasis // Pass the new salaryBasis field
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
                status: PayrollStatus.DRAFT,
                attendanceSummary: calc.attendanceSummary as any,
                compteId: dto.compteId ? Number(dto.compteId) : undefined,
                createdAt: dto.date ? new Date(dto.date) : new Date(),
            }
        });
        generatedPayrolls.push(payroll);
    }

    return { count: generatedPayrolls.length, generatedPayrolls };
  }
}
