import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }

  findAll() {
    return this.prisma.payment.findMany({
      include: {
        fee: {
          include: {
            student: true,
            employer: true,
          },
        },
        compte: true,
      } as any,
    });
  }

  findOne(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        fee: {
          include: {
            student: true,
            employer: true,
          },
        },
        compte: true,
      } as any,
    });
  }

  update(id: number, data: Prisma.PaymentUncheckedUpdateInput) {
    return this.prisma.payment.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.payment.delete({
      where: { id },
    });
  }

  async collectPayment(data: { studentId: number; amount: number; method: Prisma.EnumPaymentMethodFilter | any; date?: Date | string }) {
    const { studentId, amount, method, date } = data;
    let remainingAmount = amount;
    const createdPayments: Prisma.PaymentGetPayload<{}>[] = [];

    // 1. Fetch all fees for the student (direct + class)
    // We need to fetch fees and check for existing payments to determine pending amount
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      include: {
        fees: { include: { payments: true } },
        studentClasses: {
          include: {
            Class: {
              include: {
                fees: { include: { payments: true } }
              }
            }
          }
        }
      }
    });

    if (!student) throw new Error('Student not found');

    // 2. Flatten and calculate pending for each fee
    const allFees: (Prisma.FeeGetPayload<{ include: { payments: true } }> & { pending: number; type: string })[] = [];

    // Direct fees
    student.fees.forEach(fee => {
      const paid = fee.payments
        .reduce((sum, p) => sum + p.amount, 0);
      const pending = fee.amount - paid;
      if (pending > 0) {
        allFees.push({ ...fee, pending, type: 'DIRECT' });
      }
    });

    // Class fees
    student.studentClasses.forEach(sc => {
      sc.Class.fees.forEach(fee => {
        const paid = fee.payments
          .reduce((sum, p) => sum + p.amount, 0);
        const pending = fee.amount - paid;
        if (pending > 0) {
          allFees.push({ ...fee, pending, type: 'CLASS' });
        }
      });
    });

    // 3. Sort fees by due date (oldest first)
    allFees.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // 4. Distribute payment
    // Use a transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      for (const fee of allFees) {
        if (remainingAmount <= 0) break;

        const payAmount = Math.min(fee.pending, remainingAmount);
        
        const payment = await tx.payment.create({
          data: {
            amount: payAmount,
            method: method as any,
            date: date ? new Date(date) : new Date(),
            status: 'COMPLETED',
            fee: { connect: { id: fee.id } },
            student: { connect: { studentId } },
            ...(fee.compteId ? { compte: { connect: { id: fee.compteId } } } : {})
          }
        });

        createdPayments.push(payment);
        remainingAmount -= payAmount;
      }

      // If there's still remaining amount, it's an overpayment or credit.
      // For now, we can either throw, ignore, or create a general credit.
      // Let's just return the created payments.
      return createdPayments;
    });
  }

  async collectGenericPayment(data: { feeId: number; amount: number; method: Prisma.EnumPaymentMethodFilter | any; date?: Date | string }) {
    const { feeId, amount, method, date } = data;

    // Fetch the fee to verify it exists and is generic
    const fee = await this.prisma.fee.findUnique({
      where: { id: feeId },
      include: { payments: true }
    });

    if (!fee) throw new Error('Fee not found');
    if (fee.studentId || fee.classId) throw new Error('This endpoint is only for generic fees');

    // Calculate pending amount
    const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0);
    const pending = fee.amount - totalPaid;

    if (amount > pending) {
      throw new Error(`Payment amount (${amount}) exceeds pending amount (${pending})`);
    }

    // Create payment without student association
    const payment = await this.prisma.payment.create({
      data: {
        amount,
        method: method as any,
        date: date ? new Date(date) : new Date(),
        status: 'COMPLETED',
        description: `Generic fee payment for: ${fee.title}`,
        fee: { connect: { id: feeId } },
        ...(fee.studentId ? { student: { connect: { studentId: fee.studentId } } } : {}),
        ...((fee as any).employerId ? { employer: { connect: { employerId: (fee as any).employerId } } } : {}),
        ...(fee.compteId ? { compte: { connect: { id: fee.compteId } } } : {})
      } as any
    });

    return payment;
  }

  async getFinanceHistory() {
    const payments = await (this.prisma.payment.findMany({
      include: {
        fee: true,
        student: true,
        employer: true,
        compte: true,
      } as any,
      orderBy: { date: 'desc' },
    }) as any);

    const history = payments.map((p) => {
      const isIncome = p.fee?.type === 'income' || !!p.studentId;
      const entityName = p.fee?.student 
        ? `${p.fee.student.firstName} ${p.fee.student.lastName}`
        : p.student
        ? `${p.student.firstName} ${p.student.lastName}`
        : p.fee?.employer
        ? `${p.fee.employer.firstName} ${p.fee.employer.lastName}`
        : p.employer
        ? `${p.employer.firstName} ${p.employer.lastName}`
        : 'N/A';

      return {
        id: `p-${p.id}`,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        category: p.compte?.name || p.fee?.title || 'General',
        amount: p.amount,
        date: p.date,
        description: p.description || (isIncome ? `Fee payment: ${p.fee?.title || 'N/A'}` : `Expense: ${p.fee?.title || 'N/A'}`),
        entityName,
        method: p.method,
        compteId: p.compteId,
      };
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getStudentPayments(studentId: number) {
    return this.prisma.payment.findMany({
      where: { 
        fee: {
          studentId
        }
      },
      include: { 
        fee: true,
        compte: true,
      },
      orderBy: { date: 'desc' },
    });
  }
}
