import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    // 1. Get Current School Year for date filtering
    const currentSchoolYear = await this.prisma.schoolYear.findFirst({
      where: { isCurrent: true, tenantId },
    });

    const startDate = currentSchoolYear
      ? currentSchoolYear.startDate
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = currentSchoolYear
      ? currentSchoolYear.endDate
      : new Date(new Date().getFullYear(), 11, 31);

    // 2. Total Income (Student Fees)
    const fees = await this.prisma.fee.aggregate({
      where: {
        tenantId,
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
    const expenses = await this.prisma.expense.aggregate({
      where: {
        tenantId,
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const payrolls = await this.prisma.payroll.aggregate({
      where: {
        tenantId,
        period_start: {
          gte: startDate,
        },
        period_end: {
          lte: endDate,
        },
        status: { not: 'PAID' },
      },
      _sum: {
        netSalary: true,
      },
    });

    const totalExpenses =
      Number(expenses._sum.amount || 0) + Number(payrolls._sum.netSalary || 0);

    // 4. Net Result
    const netResult = totalIncome - totalExpenses;

    // 5. Treasury Breakdown (Caisse vs Banque)
    const treasuryAccounts = await this.prisma.compte.findMany({
      where: {
        tenantId,
        category: { in: ['CAISSE', 'BANQUE'] },
      },
      select: { id: true, category: true },
    });

    // Helper to calculate balance for a list of account IDs
    const calculateBalance = async (ids: number[]) => {
      if (ids.length === 0) return 0;
      const result = await this.prisma.journalLine.aggregate({
        where: { compteId: { in: ids }, tenantId }, // Enforce tenantId
        _sum: { debit: true, credit: true },
      });
      return Number(result._sum.debit || 0) - Number(result._sum.credit || 0);
    };

    const caisseIds = treasuryAccounts
      .filter((a) => a.category === 'CAISSE')
      .map((a) => a.id);
    const banqueIds = treasuryAccounts
      .filter((a) => a.category === 'BANQUE')
      .map((a) => a.id);

    const totalCaisse = await calculateBalance(caisseIds);
    const totalBanque = await calculateBalance(banqueIds);
    const treasuryBalance = totalCaisse + totalBanque;

    return {
      totalIncome,
      totalExpenses,
      netResult,
      treasuryBalance,
      totalCaisse,
      totalBanque,
    };
  }

  async getChartData(tenantId: string, period: string = 'monthly') {
    let startDate: Date;
    let endDate: Date = new Date();
    let interval: 'day' | 'week' | 'month' | 'year';
    let count: number;

    switch (period) {
      case 'daily':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        interval = 'day';
        count = 31;
        break;
      case 'weekly':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 12 * 7);
        interval = 'week';
        count = 13;
        break;
      case 'yearly':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);
        interval = 'year';
        count = 6;
        break;
      case 'monthly':
      default: {
        const currentSchoolYear = await this.prisma.schoolYear.findFirst({
          where: { isCurrent: true, tenantId }, // Enforce tenant
        });
        startDate = currentSchoolYear
          ? currentSchoolYear.startDate
          : new Date(new Date().getFullYear(), 0, 1);
        endDate = currentSchoolYear
          ? currentSchoolYear.endDate
          : new Date(new Date().getFullYear(), 11, 31);
        interval = 'month';
        count = 12; // Adjusted dynamically below
        break;
      }
    }

    const dataPoints: {
      name: string;
      date: Date;
      income: number;
      expense: number;
    }[] = [];
    const curr = new Date(startDate);

    if (interval === 'month') {
      curr.setDate(1);
      while (curr <= endDate) {
        dataPoints.push({
          name: curr.toLocaleString('fr-FR', { month: 'short' }),
          date: new Date(curr),
          income: 0,
          expense: 0,
        });
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (interval === 'day') {
      for (let i = 0; i < count; i++) {
        dataPoints.push({
          name: curr.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
          }),
          date: new Date(curr),
          income: 0,
          expense: 0,
        });
        curr.setDate(curr.getDate() + 1);
      }
    } else if (interval === 'week') {
      for (let i = 0; i < count; i++) {
        dataPoints.push({
          name: `W${i + 1}`,
          date: new Date(curr),
          income: 0,
          expense: 0,
        });
        curr.setDate(curr.getDate() + 7);
      }
    } else if (interval === 'year') {
      for (let i = 0; i < count; i++) {
        dataPoints.push({
          name: curr.getFullYear().toString(),
          date: new Date(curr),
          income: 0,
          expense: 0,
        });
        curr.setFullYear(curr.getFullYear() + 1);
      }
    }

    const incomeData = await this.prisma.$queryRaw<{ bucket: Date; total: number }[]>`
      SELECT DATE_TRUNC(${interval}, date) as bucket, SUM(amount)::float as total
      FROM "Payment"
      WHERE "studentId" IS NOT NULL
        AND "status" = 'COMPLETED'
        AND "tenantId" = ${tenantId}
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const expenseData = await this.prisma.$queryRaw<{ bucket: Date; total: number }[]>`
      SELECT DATE_TRUNC(${interval}, date) as bucket, SUM(amount)::float as total
      FROM "Payment"
      WHERE "expenseId" IS NOT NULL
        AND "status" = 'COMPLETED'
        AND "tenantId" = ${tenantId}
        AND date >= ${startDate}
        AND date <= ${endDate}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // Map DB results to existing dataPoints
    dataPoints.forEach((dp) => {
      const inc = incomeData.find((i) => {
        if (interval === 'month') return i.bucket.getMonth() === dp.date.getMonth() && i.bucket.getFullYear() === dp.date.getFullYear();
        if (interval === 'day') return i.bucket.toDateString() === dp.date.toDateString();
        return i.bucket.getTime() === dp.date.getTime();
      });
      if (inc) dp.income = inc.total;

      const exp = expenseData.find((e) => {
        if (interval === 'month') return e.bucket.getMonth() === dp.date.getMonth() && e.bucket.getFullYear() === dp.date.getFullYear();
        if (interval === 'day') return e.bucket.toDateString() === dp.date.toDateString();
        return e.bucket.getTime() === dp.date.getTime();
      });
      if (exp) dp.expense = exp.total;
    });

    return dataPoints.map((m) => ({
      name: m.name,
      income: m.income,
      expense: m.expense,
    }));

  }

  async getRecentTransactions(tenantId: string, limit: number = 5) {
    return this.prisma.payment.findMany({
      where: { tenantId }, // Enforce tenant
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        employer: { select: { firstName: true, lastName: true } },
        expense: { select: { title: true } },
        fee: { select: { title: true } },
      },
    });
  }

  async getExpenseCategories(tenantId: string) {
    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { tenantId }, // Enforce tenant
      _sum: {
        amount: true,
      },
    });

    // Map to format { name, value, color }
    // We can assign colors dynamically or statically based on category name
    const colors = [
      '#3b82f6',
      '#8b5cf6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#ec4899',
    ];

    return expenses.map((e, index) => ({
      name: e.category,
      value: Number(e._sum.amount || 0),
      fill: colors[index % colors.length],
    }));
  }

  async getRecentStudentPayments(tenantId: string, limit: number = 5) {
    return this.prisma.payment.findMany({
      where: {
        studentId: { not: null },
        tenantId, // Enforce tenant
      },
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        student: {
          include: {
            studentClasses: {
              where: { isCurrent: true },
              include: { Class: true },
            },
          },
        },
      },
    });
  }

  async getRecentExpenses(tenantId: string, limit: number = 5) {
    return this.prisma.expense.findMany({
      where: { tenantId }, // Enforce tenant
      take: limit,
      orderBy: { expenseDate: 'desc' },
      include: {
        compte: true, // expense account or provider account if linked
      },
    });
  }
}
