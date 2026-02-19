import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseDto) {
    return this.prisma.$transaction(async (tx) => {
      let realStart: Date | null = dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : null;
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
        },
      });

      // 3. Handle Payment (if provided)
      if (dto.payment) {
        if (!dto.payment.treasuryId) {
            throw new BadRequestException("Treasury account is required for payment");
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
            } as any
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
                    lines: {
                        create: [
                            {
                                lineNumber: 1,
                                compteId: dto.compteId, // Debit Expense
                                debit: Number(dto.amount),
                                credit: 0,
                                description: dto.title
                            },
                            {
                                lineNumber: 2,
                                compteId: dto.payment.treasuryId, // Credit Treasury
                                debit: 0,
                                credit: Number(dto.amount),
                                description: `Paiement: ${dto.title}`
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

  async findAll() {
    return this.prisma.expense.findMany({
      where: {
          category: {
              not: 'Salaires'
          }
      },
      orderBy: { expenseDate: 'desc' },
      include: {
        compte: true
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: { compte: true }
    });
  }

  async update(id: number, dto: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: {
          ...dto,
          expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
          dateStartConsommation: dto.dateStartConsommation ? new Date(dto.dateStartConsommation) : undefined,
          dateEndConsommation: dto.dateEndConsommation ? new Date(dto.dateEndConsommation) : undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.expense.delete({ where: { id } });
  }

  async pay(id: number, payload: { treasuryId: number; method: string }) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({ where: { id } });
      if (!expense) throw new BadRequestException('Expense not found');
      if (expense.isPaid) throw new BadRequestException('Expense already paid');

      if (!payload.treasuryId) throw new BadRequestException('Treasury account required');

      // Create Payment
      const payment = await tx.payment.create({
        data: {
          amount: Number(expense.amount),
          method: payload.method as any, // Cast to verify against schema if needed
          date: new Date(),
          status: 'COMPLETED',
          expenseId: expense.id,
          compteId: payload.treasuryId,
          compteSourceId: payload.treasuryId,
          compteDestId: expense.compteId,
          description: `Paiement Dépense: ${expense.title}`,
        } as any
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
                lines: {
                    create: [
                        {
                            lineNumber: 1,
                            compteId: expense.compteId, // Debit Expense Account
                            debit: Number(expense.amount),
                            credit: 0,
                            description: expense.title
                        },
                        {
                            lineNumber: 2,
                            compteId: payload.treasuryId, // Credit Treasury Account
                            debit: 0,
                            credit: Number(expense.amount),
                            description: `Paiement: ${expense.title}`
                        }
                    ]
                }
            }
        });
      }

      // Update Expense
      return tx.expense.update({
        where: { id },
        data: { isPaid: true }
      });
    });
  }
}
