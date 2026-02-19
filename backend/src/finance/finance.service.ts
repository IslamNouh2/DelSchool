import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    // 1. Get Current School Year for date filtering
    const currentSchoolYear = await this.prisma.schoolYear.findFirst({
      where: { isCurrent: true },
    });

    const startDate = currentSchoolYear ? currentSchoolYear.startDate : new Date(new Date().getFullYear(), 0, 1);
    const endDate = currentSchoolYear ? currentSchoolYear.endDate : new Date(new Date().getFullYear(), 11, 31);

    // 2. Total Income (Student Fees)
    // We assume Income = Fees created or due in this period?
    // Or Payments linked to Fees? 
    // Usually "Chiffre d'affaire" is billed fees.
    const fees = await this.prisma.fee.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const totalIncome = Number(fees._sum.amount || 0);

    // 3. Total Expenses (Recorded Expenses + Payroll?)
    // Expenses
    const expenses = await this.prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    // Payroll (Net Salary + Allowances - Deductions? Or just Net Salary paid?)
    // For P&L, it's Gross Salary (Base + Allowances).
    // Let's sum NetSalary for now as a proxy if Gross not easy, but schema has baseSalary.
    // Let's use Net Salary for simplicity or Base + Allowances.
    const payrolls = await this.prisma.payroll.aggregate({
      where: {
        period_start: {
          gte: startDate,
        },
        period_end: {
          lte: endDate,
        },
        status: { not: 'PAID' } // Exclude PAID payrolls as they are already in Expenses
      },
      _sum: {
        netSalary: true, // simplified
      }
    });

    const totalExpenses = Number(expenses._sum.amount || 0) + Number(payrolls._sum.netSalary || 0);

    // 4. Net Result
    const netResult = totalIncome - totalExpenses;

    // 5. Treasury Breakdown (Caisse vs Banque)
    const treasuryAccounts = await this.prisma.compte.findMany({
        where: {
            category: { in: ['CAISSE', 'BANQUE'] }
        },
        select: { id: true, category: true }
    });
    
    // Helper to calculate balance for a list of account IDs
    const calculateBalance = async (ids: number[]) => {
        if (ids.length === 0) return 0;
        const result = await this.prisma.journalLine.aggregate({
            where: { compteId: { in: ids } },
            _sum: { debit: true, credit: true }
        });
        return Number(result._sum.debit || 0) - Number(result._sum.credit || 0);
    };

    const caisseIds = treasuryAccounts.filter(a => a.category === 'CAISSE').map(a => a.id);
    const banqueIds = treasuryAccounts.filter(a => a.category === 'BANQUE').map(a => a.id);

    const totalCaisse = await calculateBalance(caisseIds);
    const totalBanque = await calculateBalance(banqueIds);
    const treasuryBalance = totalCaisse + totalBanque;

    return {
      totalIncome,
      totalExpenses,
      netResult,
      treasuryBalance,
      totalCaisse,
      totalBanque
    };
  }

  async getChartData() {
    // 1. Get Current School Year
    const currentSchoolYear = await this.prisma.schoolYear.findFirst({
      where: { isCurrent: true },
    });

    const startDate = currentSchoolYear ? currentSchoolYear.startDate : new Date(new Date().getFullYear(), 0, 1);
    const endDate = currentSchoolYear ? currentSchoolYear.endDate : new Date(new Date().getFullYear(), 11, 31);

    // 2. Generate months between start and end
    const months: { name: string; date: Date; income: number; expense: number }[] = [];
    let currentDate = new Date(startDate);
    // Align to 1st of month
    currentDate.setDate(1);

    while (currentDate <= endDate) {
        months.push({
            name: currentDate.toLocaleString('fr-FR', { month: 'short' }), // e.g. "sept."
            date: new Date(currentDate), // Keep reference for matching
            income: 0,
            expense: 0
        });
        // Next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // 3. Fetch Payments (Cash Flow)
    const payments = await this.prisma.payment.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            },
            status: 'COMPLETED' // Only completed payments
        },
        select: { date: true, amount: true, studentId: true, expenseId: true }
    });

    // 4. Map Data to Months
    payments.forEach(p => {
        const pDate = new Date(p.date);
        const monthIndex = months.findIndex(m => 
            m.date.getMonth() === pDate.getMonth() && 
            m.date.getFullYear() === pDate.getFullYear()
        );

        if (monthIndex !== -1) {
            // Income: Student Payments
            if (p.studentId) {
                months[monthIndex].income += Number(p.amount);
            }
            // Expense: Expense Payments (includes Payrolls linked to Expenses)
            if (p.expenseId) {
                months[monthIndex].expense += Number(p.amount);
            }
        }
    });

    // Clean up date object before return
    return months.map(m => ({
        name: m.name,
        income: m.income,
        expense: m.expense
    }));
  }

  async getRecentTransactions(limit: number = 5) {
      return this.prisma.payment.findMany({
          take: limit,
          orderBy: { date: 'desc' },
          include: {
              student: { select: { firstName: true, lastName: true } },
              employer: { select: { firstName: true, lastName: true } },
              expense: { select: { title: true } },
              fee: { select: { title: true } }
          }
      });
  }

  async getExpenseCategories() {
      const expenses = await this.prisma.expense.groupBy({
          by: ['category'],
          _sum: {
              amount: true
          }
      });

      // Map to format { name, value, color }
      // We can assign colors dynamically or statically based on category name
      const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
      
      return expenses.map((e, index) => ({
          name: e.category,
          value: Number(e._sum.amount || 0),
          fill: colors[index % colors.length]
      }));
  }

  async getRecentStudentPayments(limit: number = 5) {
      return this.prisma.payment.findMany({
          where: {
              studentId: { not: null }
          },
          take: limit,
          orderBy: { date: 'desc' },
          include: {
              student: {
                  include: {
                      studentClasses: {
                          where: { isCurrent: true },
                          include: { Class: true }
                      }
                  }
              }
          }
      });
  }

  async getRecentExpenses(limit: number = 5) {
      return this.prisma.expense.findMany({
          take: limit,
          orderBy: { expenseDate: 'desc' },
          include: {
              compte: true // expense account or provider account if linked
          }
      });
  }
}
