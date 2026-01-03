import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';


@Injectable()
export class FeeService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway
  ) {}


  async create(data: Prisma.FeeUncheckedCreateInput) {
    // Auto-associate student or employer if compteId is provided
    if (data.compteId) {
      const compte = await this.prisma.compte.findUnique({
        where: { id: data.compteId }
      });
      if (compte) {
        if (compte.studentId) data.studentId = compte.studentId;
        if (compte.employerId) data.employerId = compte.employerId;
      }
    }
    const fee = await this.prisma.fee.create({ data: data as any });
    this.socketGateway.emitRefresh();
    return fee;
  }

  findAll() {
    return this.prisma.fee.findMany({
      include: {
        class: true,
        student: true,
        payments: true,
        compte: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.fee.findUnique({
      where: { id },
      include: {
        class: true,
        student: true,
        payments: true,
        compte: true,
      },
    });
  }

  async update(id: number, data: Prisma.FeeUpdateInput) {
    const fee = await this.prisma.fee.update({
      where: { id },
      data,
    });
    this.socketGateway.emitRefresh();
    return fee;
  }

  async remove(id: number) {
    // Check if fee has payments
    const fee = await this.prisma.fee.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (fee?.payments && fee.payments.length > 0) {
      throw new Error('Cannot delete fee with associated payments. Delete payments first.');
    }

    const deleted = await this.prisma.fee.delete({
      where: { id },
    });
    this.socketGateway.emitRefresh();
    return deleted;
  }

  // Dashboard Stats
  async getDashboardStats() {
    // 1. Total Collected
    const payments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }
    });
    const totalCollected = payments._sum.amount || 0;

    // 2. Total Expenses
    const expensePayments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { 
        status: 'COMPLETED',
        fee: { type: 'expense' }
      }
    });
    const totalExpenses = expensePayments._sum.amount || 0;

    // 3. Total Expected Fees
    // We need to fetch all fees and calculate based on assignment
    const fees = await this.prisma.fee.findMany({
      include: { class: { include: { studentClasses: true } } }
    });

    let totalExpected = 0;
    for (const fee of fees) {
      if (fee.studentId) {
        totalExpected += fee.amount;
      } else if (fee.classId && fee.class) {
        // Count students in this class (using studentClasses relation)
        // We should probably filter for current academic year if possible, but schema doesn't strictly enforce it on Fee
        // Assuming all students in the class are liable
        const studentCount = fee.class.studentClasses.length; 
        totalExpected += fee.amount * studentCount;
      }
    }

    const pendingFees = totalExpected - totalCollected;
    const netBalance = totalCollected - totalExpenses;

    // 4. Paid Students Count
    // This is expensive to calculate perfectly without a materialized view or complex query.
    // For now, let's approximate or calculate fully if dataset is small.
    // Let's calculate fully for now.
    const allStudents = await this.prisma.student.findMany({
      include: {
        fees: true, // Direct fees
        studentClasses: { include: { Class: { include: { fees: true } } } }, // Class fees
        payments: true
      }
    });

    let paidStudentsCount = 0;
    for (const student of allStudents) {
      let studentTotalFee = 0;
      // Direct fees
      student.fees.forEach(f => studentTotalFee += f.amount);
      // Class fees
      student.studentClasses.forEach(sc => {
        sc.Class.fees.forEach(f => studentTotalFee += f.amount);
      });

      const studentPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
      if (studentPaid >= studentTotalFee && studentTotalFee > 0) {
        paidStudentsCount++;
      }
    }

    // 5. Average Fee (per student)
    const averageFee = allStudents.length > 0 ? totalExpected / allStudents.length : 0;

    return {
      totalCollected,
      totalExpenses,
      netBalance,
      pendingFees,
      paidStudents: paidStudentsCount,
      averageFee
    };
  }

  // Fee Types Distribution
  async getFeeTypes() {
    // Group by title? Or we might need a 'type' field in Fee. 
    // Schema has 'title'. Let's group by title.
    const fees = await this.prisma.fee.groupBy({
      by: ['title'],
      _sum: { amount: true },
    });
    
    // This sum is just the sum of fee definitions, not the total expected revenue from that type.
    // To get total revenue per type, we need the expansion logic again.
    // Let's do it manually.
    const allFees = await this.prisma.fee.findMany({
        include: { 
          class: { include: { studentClasses: true } },
          compte: true
        }
    });

    const typeMap = new Map<string, number>();

    for (const fee of allFees) {
        let amount = 0;
        if (fee.studentId) {
            amount = fee.amount;
        } else if (fee.classId && fee.class) {
            amount = fee.amount * fee.class.studentClasses.length;
        }
        
        const typeName = fee.compte?.name || fee.title;
        const current = typeMap.get(typeName) || 0;
        typeMap.set(typeName, current + amount);
    }

    // Convert to array and add colors
    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
    return Array.from(typeMap.entries()).map(([name, amount], index) => ({
        name,
        amount,
        color: colors[index % colors.length]
    }));
  }

  // Detailed Fee Status List (all individual liabilities)
  async getDetailedFeeStatus() {
    const students = await this.prisma.student.findMany({
      include: {
        fees: { include: { payments: true, compte: true } },
        studentClasses: { 
          include: { 
            Class: { 
              include: { 
                fees: { include: { payments: true, compte: true } } 
              } 
            } 
          } 
        },
        payments: true
      },
      orderBy: { lastName: 'asc' }
    });

    const detailedStatus: any[] = [];

    students.forEach(student => {
      // 1. Direct Fees
      student.fees.forEach(fee => {
        const paid = fee.payments
          .reduce((sum, p) => sum + p.amount, 0);
        const pending = fee.amount - paid;
        
        detailedStatus.push({
          id: `${student.studentId}-fee-${fee.id}`,
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          class: student.studentClasses[0]?.Class.ClassName || 'N/A',
          feeId: fee.id,
          feeTitle: fee.title,
          account: fee.compte?.name || 'N/A',
          amount: fee.amount,
          paid,
          pending: pending > 0 ? pending : 0,
          status: pending <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
          dueDate: fee.dueDate
        });
      });

      // 2. Class Fees
      student.studentClasses.forEach(sc => {
        sc.Class.fees.forEach(fee => {
          // For class fees, we need to find payments by this student for this specific fee
          const paid = fee.payments
            .filter(p => p.studentId === student.studentId)
            .reduce((sum, p) => sum + p.amount, 0);
          const pending = fee.amount - paid;

          detailedStatus.push({
            id: `${student.studentId}-classfee-${fee.id}-${sc.id}`,
            studentId: student.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            class: sc.Class.ClassName,
            feeId: fee.id,
            feeTitle: fee.title,
            account: fee.compte?.name || 'N/A',
            amount: fee.amount,
            paid,
            pending: pending > 0 ? pending : 0,
            status: pending <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
            dueDate: fee.dueDate
          });
        });
      });
    });

    return detailedStatus;
  }
}
