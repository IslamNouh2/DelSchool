import { Injectable } from '@nestjs/common';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class CompteService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async create(tenantId: string, createCompteDto: CreateCompteDto) {
    let {
      name,
      code,
      nameAr,
      parentId,
      employerId,
      studentId,
      isPosted,
      category,
      nature,
      selectionCode,
      isFeeCash,
      showInParent,
    } = createCompteDto;
    parentId = parentId ?? -1;

    // Step 1: Get BG, BD, and calculate level of the parent
    const parent = await this.prisma.compte.findUnique({
      where: { id: parentId, tenantId }, // Enforce tenant
      select: { BG: true, BD: true, level: true },
    });

    if (!parent && parentId !== -1) {
      throw new Error('Parent account not found');
    }

    const {
      BG: parentBG,
      BD: parentBD,
      level: parentLevel,
    } = parent || {
      BG: 0,
      BD: 0,
      level: -1,
    };

    // Calculate the new account's level
    const level = parentId === -1 ? 0 : (parentLevel ?? 0) + 1;

    // Step 2: Use transaction to update & insert
    return this.prisma.$transaction(async (tx) => {
      // Update existing accounts' BG/BD values
      await tx.compte.updateMany({
        where: { BG: { gt: parentBD }, tenantId }, // Enforce tenant
        data: { BG: { increment: 2 } },
      });

      await tx.compte.updateMany({
        where: { BD: { gte: parentBD }, tenantId }, // Enforce tenant
        data: { BD: { increment: 2 } },
      });

      // Create the new account with calculated level
      const newCompte = await tx.compte.create({
        data: {
          name,
          code,
          nameAr,
          parentId,
          BG: parentBD,
          BD: parentBD + 1,
          level,
          dateCreate: new Date(),
          dateModif: new Date(),
          isPosted: isPosted ?? false,
          employerId,
          studentId,
          category: category || 'GENERAL',
          nature: nature || 'ASSET',
          isFeeCash: isFeeCash ?? false,
          showInParent: showInParent ?? true,
          selectionCode,
          tenantId, // Enforce tenant
        } as any,
      });

      this.socketGateway.emitRefresh();
      return newCompte;
    });
  }

  async findAll(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId, // Enforce tenant
      id: { gt: -1 },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      if (status === 'active') where.isPosted = false;
      else if (status === 'blocked') where.isPosted = true;
    }

    const [comptes, total] = await this.prisma.$transaction([
      this.prisma.compte.findMany({
        where,
        orderBy: { BG: 'asc' },
        skip,
        take: limit,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          employer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          // Include lines to calculate balance? efficient?
          // For paginated list of 10-100 accounts, it's okay.
          journalEntryLines: {
            select: {
              debit: true,
              credit: true,
            },
          },
        } as any,
      }),
      this.prisma.compte.count({ where }),
    ]);

    // Calculate balance for each account
    const comptesWithBalance = comptes.map((compte: any) => {
      const totalDebit = compte.journalEntryLines.reduce(
        (sum, line) => sum + Number(line.debit),
        0,
      );
      const totalCredit = compte.journalEntryLines.reduce(
        (sum, line) => sum + Number(line.credit),
        0,
      );

      // Determine balance direction based on nature/category
      // ASSET/EXPENSE (Debit Normal): Balance = Debit - Credit
      // LIABILITY/EQUITY/INCOME (Credit Normal): Balance = Credit - Debit
      // For now, let's assume standard Asset/Liability logic if 'nature' exists,
      // or use Category: CAISSE/BANQUE are ASSETS.

      let balance = 0;
      if (
        compte.nature === 'ASSET' ||
        compte.nature === 'EXPENSE' ||
        ['CAISSE', 'BANQUE', 'DEPENSE'].includes(compte.category)
      ) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      // Remove lines from output to keep payload clean if not needed
      // const { journalEntryLines, ...rest } = compte;
      // return { ...rest, balance };
      // Actually, frontend might not expect 'lines' but expects 'balance'
      return {
        ...compte,
        balance,
      };
    });

    return {
      comptes: comptesWithBalance,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: number) {
    return this.prisma.compte.findUnique({
      where: { id, tenantId }, // Enforce tenant
      include: {
        parent: { select: { id: true, name: true } },
        employer: true,
        student: true,
      } as any,
    });
  }

  async update(tenantId: string, id: number, updateDto: UpdateCompteDto) {
    const {
      name,
      code,
      nameAr,
      parentId: newParentIdInput,
      isPosted,
      employerId,
      studentId,
      category,
      nature,
      isFeeCash,
      showInParent,
      selectionCode,
    } = updateDto;
    const parentId = newParentIdInput;

    const current = await this.prisma.compte.findUnique({
      where: { id, tenantId }, // Enforce tenant
      select: { BG: true, BD: true, parentId: true },
    });

    if (!current) throw new Error('Account not found');

    // If parent changed, handle nested set movement
    if (parentId !== undefined && current.parentId !== parentId) {
      const parent = await this.prisma.compte.findUnique({
        where: { id: parentId, tenantId }, // Enforce tenant
        select: { BD: true },
      });

      if (!parent && parentId !== -1) throw new Error('New parent not found');

      const width = current.BD - current.BG + 1;

      await this.prisma.$transaction(async (tx) => {
        // Temporarily remove the current node and its subtree
        await tx.compte.updateMany({
          where: {
            BG: { gte: current.BG },
            BD: { lte: current.BD },
            tenantId, // Enforce tenant
          },
          data: {
            BG: { increment: -current.BG },
            BD: { increment: -current.BG },
          },
        });

        await tx.compte.updateMany({
          where: { BG: { gt: current.BD }, tenantId }, // Enforce tenant
          data: { BG: { decrement: width } },
        });

        await tx.compte.updateMany({
          where: { BD: { gt: current.BD }, tenantId }, // Enforce tenant
          data: { BD: { decrement: width } },
        });

        // Make room under new parent
        const newPos = parentId === -1 ? 1 : parent.BD;

        await tx.compte.updateMany({
          where: { BG: { gte: newPos }, tenantId }, // Enforce tenant
          data: { BG: { increment: width } },
        });

        await tx.compte.updateMany({
          where: { BD: { gte: newPos }, tenantId }, // Enforce tenant
          data: { BD: { increment: width } },
        });

        // Move subtree to new location
        await tx.compte.updateMany({
          where: { BG: { lt: 0 }, tenantId }, // Enforce tenant
          data: {
            BG: { increment: newPos },
            BD: { increment: newPos },
          },
        });

        await tx.compte.update({
          where: { id, tenantId }, // Enforce tenant
          data: {
            name,
            code,
            nameAr,
            parentId,
            isPosted,
            employerId,
            studentId,
            category,
            nature,
            isFeeCash,
            showInParent,
            selectionCode,
            dateModif: new Date(),
          } as any,
        });
      });
    } else {
      await this.prisma.compte.update({
        where: { id, tenantId }, // Enforce tenant
        data: {
          name,
          code,
          nameAr,
          isPosted,
          employerId,
          studentId,
          category,
          nature,
          isFeeCash,
          showInParent,
          selectionCode,
          dateModif: new Date(),
        } as any,
      });
    }

    this.socketGateway.emitRefresh();
    return { message: 'Account updated successfully' };
  }

  async getTransactions(
    tenantId: string,
    id: number,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { compteId: id, tenantId }; // Enforce tenant

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    if (Object.keys(dateFilter).length > 0) {
      where.entry = { date: dateFilter };
    }

    if (search) {
      where.AND = [
        ...(where.entry ? [{ entry: where.entry }] : []),
        {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            {
              entry: {
                OR: [
                  { entryNumber: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          ],
        },
      ];
      // Remove the top-level entry filter if we moved it into AND
      delete where.entry;
    }

    const [lines, total, aggregates] = await this.prisma.$transaction([
      this.prisma.journalLine.findMany({
        where,
        include: {
          entry: {
            include: {
              lines: {
                include: {
                  compte: {
                    select: { name: true, code: true },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          entry: {
            date: 'desc',
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.journalLine.count({ where }),
      this.prisma.journalLine.aggregate({
        where,
        _sum: {
          debit: true,
          credit: true,
        },
      }),
    ]);

    const transactions = lines.map((line) => {
      const otherLine = line.entry.lines.find((l) => l.compteId !== id);
      const partnerAccount = otherLine ? otherLine.compte.name : null;
      const partnerCode = otherLine ? otherLine.compte.code : null;

      return {
        id: line.id,
        entryId: line.entry.id,
        date: line.entry.date,
        description: line.description || line.entry.description,
        debit: Number(line.debit),
        credit: Number(line.credit),
        reference: line.entry.entryNumber,
        referenceType: line.entry.referenceType,
        referenceId: line.entry.referenceId,
        partnerAccount,
        partnerCode,
      };
    });

    const totalIn = Number(aggregates._sum.debit || 0);
    const totalOut = Number(aggregates._sum.credit || 0);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalIn,
        totalOut,
        totalBalance: totalIn - totalOut, // Adjust based on account logic?
        // For Treasury view (Caisse/Banque), usually In - Out = Current Balance in period
      },
    };

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTransaction(
    tenantId: string,
    compteId: number,
    dto: any,
    userId: number,
  ) {
    // userId 1 as default if not provided, though controller should provide it
    const currentUserId = userId || 1;

    const { amount, type, description, contraAccountId, date } = dto;
    const transactionDate = date ? new Date(date) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // Determine Debit/Credit based on type
      // If Type is DEBIT (Encaissement into Caisse):
      //   Caisse: DEBIT
      //   Contra (Source): CREDIT
      // If Type is CREDIT (Décaissement from Caisse):
      //   Caisse: CREDIT
      //   Contra (Destination/Expense): DEBIT

      let debitAccount = 0;
      let creditAccount = 0;

      if (type === 'DEBIT') {
        debitAccount = compteId;
        creditAccount = contraAccountId;
      } else {
        debitAccount = contraAccountId;
        creditAccount = compteId;
      }

      // Verify accounts exist
      const accountCheck = await tx.compte.findMany({
        where: { id: { in: [debitAccount, creditAccount] }, tenantId }, // Enforce tenant
      });
      if (accountCheck.length !== 2)
        throw new Error('One or both accounts not found');

      // Create Journal Entry
      // We need a Journal. Let's use GEN (1) for now or maybe CASH (2) if it involves Caisse?
      // If compteId is Caisse, use Caisse Journal.
      const mainAccount = await tx.compte.findUnique({
        where: { id: compteId, tenantId },
      }); // Enforce tenant
      let journalId = 1; // Default General
      if (mainAccount?.category === 'CAISSE') journalId = 2;
      if (mainAccount?.category === 'BANQUE') journalId = 3;

      const entry = await tx.journalEntry.create({
        data: {
          journalId,
          entryNumber: `TRX-${Date.now()}`,
          date: transactionDate,
          description,
          totalDebit: amount,
          totalCredit: amount,
          status: 'POSTED',
          createdBy: currentUserId,
          tenantId, // Enforce tenant
          lines: {
            create: [
              {
                lineNumber: 1,
                compteId: debitAccount,
                debit: amount,
                credit: 0,
                description,
                tenantId, // Enforce tenant
              },
              {
                lineNumber: 2,
                compteId: creditAccount,
                debit: 0,
                credit: amount,
                description,
                tenantId, // Enforce tenant
              },
            ],
          },
        },
      });

      this.socketGateway.emitRefresh();
      return entry;
    });
  }

  async updateTransaction(
    tenantId: string,
    entryId: number,
    dto: any,
    userId: number,
  ) {
    const { amount, type, description, contraAccountId, date } = dto;
    const transactionDate = date ? new Date(date) : new Date();
    const mainAccountId = dto.compteId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Get existing entry with lines
      const existingEntry = await tx.journalEntry.findUnique({
        where: { id: entryId, tenantId }, // Enforce tenant
        include: { lines: true },
      });

      if (!existingEntry) throw new Error('Transaction not found');

      // 2. Identify roles of existing lines (who was debit, who was credit?)
      // We assume a simple 2-line entry for now as created by createTransaction
      if (existingEntry.lines.length !== 2) {
        // Determine logic for complex entries or just fail?
        // For this specific feature, we only support editing entries created by this module (2 lines)
      }

      // Determine new Debit/Credit accounts
      // If type is DEBIT (Into Main Account): Main=Debit, Contra=Credit
      let debitAccount = 0;
      let creditAccount = 0;

      if (type === 'DEBIT') {
        debitAccount = mainAccountId;
        creditAccount = contraAccountId;
      } else {
        debitAccount = contraAccountId;
        creditAccount = mainAccountId;
      }

      // Verify accounts exist
      const accountCheck = await tx.compte.findMany({
        where: { id: { in: [debitAccount, creditAccount] }, tenantId }, // Enforce tenant
      });
      if (accountCheck.length !== 2)
        throw new Error('One or both accounts not found');

      // 3. Update Entry Header
      await tx.journalEntry.update({
        where: { id: entryId, tenantId }, // Enforce tenant
        data: {
          date: transactionDate,
          description,
          totalDebit: amount,
          totalCredit: amount,
          // createdBy ? maybe updatedBy?
        },
      });

      // 4. Update Lines
      // Easier to delete and recreate lines? Or update in place?
      // Delete and recreate is safer to ensure correct debit/credit assignment
      await tx.journalLine.deleteMany({
        where: { entryId, tenantId }, // Enforce tenant
      });

      await tx.journalLine.createMany({
        data: [
          {
            entryId,
            lineNumber: 1,
            compteId: debitAccount,
            debit: amount,
            credit: 0,
            description,
            tenantId, // Enforce tenant
          },
          {
            entryId,
            lineNumber: 2,
            compteId: creditAccount,
            debit: 0,
            credit: amount,
            description,
            tenantId, // Enforce tenant
          },
        ],
      });

      this.socketGateway.emitRefresh();
      return { message: 'Transaction updated' };
    });
  }

  async deleteTransaction(tenantId: string, entryId: number) {
    // Find entry to ensure it exists
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: entryId, tenantId }, // Enforce tenant
    });

    if (!entry) throw new Error('Transaction not found');

    // Delete Entry (Cascade delete configured? If not, delete lines first)
    // Prisma schema usually handles cascade if defined, but safe manual delete:
    await this.prisma.$transaction(async (tx) => {
      await tx.journalLine.deleteMany({ where: { entryId, tenantId } }); // Enforce tenant
      await tx.journalEntry.delete({ where: { id: entryId, tenantId } }); // Enforce tenant
    });

    this.socketGateway.emitRefresh();
    return { message: 'Transaction deleted' };
  }

  async remove(tenantId: string, id: number) {
    const compte = await this.prisma.compte.findUnique({
      where: { id, tenantId }, // Enforce tenant
    });

    if (!compte) {
      throw new Error('Account Not Exist');
    }

    // For Nested Set, we should ideally update other nodes, but following subject pattern
    await this.prisma.compte.delete({ where: { id, tenantId } }); // Enforce tenant
    this.socketGateway.emitRefresh();
  }

  // Helper to ensure "Salaires" parent account exists
  async ensureSalaryParentAccount(tenantId: string) {
    const salaryAccount = await this.prisma.compte.findFirst({
      where: {
        code: '63',
        tenantId, // Enforce tenant
      },
    });

    if (salaryAccount) return salaryAccount;

    // Find Class 6 root
    const class6 = await this.prisma.compte.findFirst({
      where: { code: '6', tenantId },
    }); // Enforce tenant

    if (!class6) {
      // Create 'Salaires' at root if 6 missing
      return this.create(tenantId, {
        name: 'Charges de personnel',
        code: '63',
        category: 'EXPENSE',
        nature: 'EXPENSE',
        parentId: -1,
      } as any);
    }

    return this.create(tenantId, {
      name: 'Personnel et comptes rattachés',
      code: '63',
      category: 'EXPENSE',
      nature: 'EXPENSE',
      parentId: class6.id,
    } as any);
  }

  async getOrCreateEmployerAccount(
    tenantId: string,
    employerId: number,
    name: string,
  ) {
    // Check if account exists for this employer
    const existingAccount = await this.prisma.compte.findFirst({
      where: { employerId, tenantId }, // Enforce tenant
    });

    if (existingAccount) return existingAccount;

    // Ensure Parent "Salaires" exists
    // Try to find a parent with code 63 or name containing Salaires
    let parent = await this.prisma.compte.findFirst({
      where: {
        tenantId, // Enforce tenant
        OR: [
          { code: { startsWith: '63' } },
          { name: { contains: 'Salaire', mode: 'insensitive' } },
          { name: { contains: 'Salary', mode: 'insensitive' } }, // Add English search
        ],
      },
    });

    if (!parent) {
      // Create Parent
      parent = await this.ensureSalaryParentAccount(tenantId);
    }

    // Create Employer Account
    // We need to generate a unique code.
    // Simple strategy: ParentCode + EmployerID (padded?)
    // Let's assume 63 + 00 + ID
    const code = `${parent.code}${employerId.toString().padStart(3, '0')}`;

    // Check if code collision (unlikely but safe)
    const check = await this.prisma.compte.findFirst({
      where: { code, tenantId },
    }); // Enforce tenant
    if (check) return check;

    return this.create(tenantId, {
      name: `Salaire - ${name}`,
      code,
      parentId: parent.id,
      employerId: employerId,
      category: 'EXPENSE',
      nature: 'EXPENSE',
    } as any);
  }
}
