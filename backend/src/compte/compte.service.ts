import { Injectable } from '@nestjs/common';
import { CreateCompteDto } from './dto/create-compte.dto';
import { UpdateCompteDto } from './dto/update-compte.dto';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';


@Injectable()
export class CompteService {
    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) { }


    async create(createCompteDto: CreateCompteDto) {
        let { 
            name, code, nameAr, parentId, employerId, studentId, isPosted,
            category, nature, selectionCode,
            isFeeCash, showInParent
        } = createCompteDto;
        parentId = parentId ?? -1;

        // Step 1: Get BG, BD, and calculate level of the parent
        const parent = await this.prisma.compte.findUnique({
            where: { id: parentId },
            select: { BG: true, BD: true, level: true },
        });

        if (!parent && parentId !== -1) {
            throw new Error('Parent account not found');
        }

        const { BG: parentBG, BD: parentBD, level: parentLevel } = parent || {
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
                where: { BG: { gt: parentBD } },
                data: { BG: { increment: 2 } },
            });

            await tx.compte.updateMany({
                where: { BD: { gte: parentBD } },
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
                    category: category || "GENERAL",
                    nature: nature || "ASSET",
                    isFeeCash: isFeeCash ?? false,
                    showInParent: showInParent ?? true,
                    selectionCode,
                } as any,
            });

            this.socketGateway.emitRefresh();
            return newCompte;
        });
    }

    async findAll(
        page: number = 1,
        limit: number = 10,
        name?: string,
        status?: string,
    ) {
        const skip = (page - 1) * limit;

        const where: any = {
            id: { gt: -1 },
        };

        if (name) {
            where.name = {
                contains: name,
                mode: 'insensitive',
            };
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
                        }
                    },
                    employer: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    },
                    student: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    },
                    // Include lines to calculate balance? efficient?
                    // For paginated list of 10-100 accounts, it's okay.
                    journalEntryLines: {
                        select: {
                            debit: true,
                            credit: true
                        }
                    }
                } as any,
            }),
            this.prisma.compte.count({ where }),
        ]);

        // Calculate balance for each account
        const comptesWithBalance = comptes.map((compte: any) => {
            const totalDebit = compte.journalEntryLines.reduce((sum, line) => sum + Number(line.debit), 0);
            const totalCredit = compte.journalEntryLines.reduce((sum, line) => sum + Number(line.credit), 0);
            
            // Determine balance direction based on nature/category
            // ASSET/EXPENSE (Debit Normal): Balance = Debit - Credit
            // LIABILITY/EQUITY/INCOME (Credit Normal): Balance = Credit - Debit
            // For now, let's assume standard Asset/Liability logic if 'nature' exists, 
            // or use Category: CAISSE/BANQUE are ASSETS.
            
            let balance = 0;
            if (compte.nature === 'ASSET' || compte.nature === 'EXPENSE' || ['CAISSE', 'BANQUE', 'DEPENSE'].includes(compte.category)) {
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
                balance
            };
        });

        return {
            comptes: comptesWithBalance,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        return this.prisma.compte.findUnique({
            where: { id },
            include: { 
                parent: { select: { id: true, name: true } },
                employer: true,
                student: true
            } as any,
        });
    }

    async update(id: number, updateDto: UpdateCompteDto) {
        const { 
            name, code, nameAr, parentId: newParentIdInput, isPosted, employerId, studentId,
            category, nature, isFeeCash, showInParent, selectionCode
        } = updateDto;
        const parentId = newParentIdInput;

        const current = await this.prisma.compte.findUnique({
            where: { id },
            select: { BG: true, BD: true, parentId: true },
        });

        if (!current) throw new Error('Account not found');

        // If parent changed, handle nested set movement
        if (parentId !== undefined && current.parentId !== parentId) {
            const parent = await this.prisma.compte.findUnique({
                where: { id: parentId },
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
                    },
                    data: {
                        BG: { increment: -current.BG },
                        BD: { increment: -current.BG },
                    },
                });

                await tx.compte.updateMany({
                    where: { BG: { gt: current.BD } },
                    data: { BG: { decrement: width } },
                });

                await tx.compte.updateMany({
                    where: { BD: { gt: current.BD } },
                    data: { BD: { decrement: width } },
                });

                // Make room under new parent
                const newPos = parentId === -1 ? 1 : parent!.BD;

                await tx.compte.updateMany({
                    where: { BG: { gte: newPos } },
                    data: { BG: { increment: width } },
                });

                await tx.compte.updateMany({
                    where: { BD: { gte: newPos } },
                    data: { BD: { increment: width } },
                });

                // Move subtree to new location
                await tx.compte.updateMany({
                    where: { BG: { lt: 0 } },
                    data: {
                        BG: { increment: newPos },
                        BD: { increment: newPos },
                    },
                });

                await tx.compte.update({
                    where: { id },
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
                where: { id },
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

    async getTransactions(id: number, startDate?: string, endDate?: string) {
        const where: any = { compteId: id };

        if (startDate && endDate) {
            where.entry = {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                }
            };
        } else if (startDate) {
             where.entry = {
                date: {
                    gte: new Date(startDate),
                }
            };
        } else if (endDate) {
             where.entry = {
                date: {
                    lte: new Date(endDate),
                }
            };
        }

        // Fetch journal lines where this account is involved
        // Order by date descending
        const lines = await this.prisma.journalLine.findMany({
            where,
            include: {
                entry: {
                    include: {
                        lines: {
                            include: {
                                compte: {
                                    select: { name: true, code: true }
                                }
                            }
                        }
                    }
                }, 
            },
            orderBy: {
                entry: {
                    date: 'desc',
                },
            },
        });

        // Calculate running balance or just return lines?
        // For simple history, just lines is fine. Frontend can calc totals.
        return lines.map(line => {
            // Find the other side of the transaction (partner)
            // It's the line in the same entry that does NOT match this account ID.
            // If multiple lines, we might just take the first one or join them.
            // For simple Double Entry, it's just the other one.
            const otherLine = line.entry.lines.find(l => l.compteId !== id);
            const partnerAccount = otherLine ? otherLine.compte.name : null;
            const partnerCode = otherLine ? otherLine.compte.code : null;

            return {
                id: line.id,
                entryId: line.entry.id, 
                date: line.entry.date,
                description: line.description || line.entry.description,
                // Ensure we return numbers, even if 0
                debit: Number(line.debit),
                credit: Number(line.credit),
                reference: line.entry.entryNumber,
                referenceType: line.entry.referenceType, 
                referenceId: line.entry.referenceId,
                partnerAccount,
                partnerCode
            };
        });
    }

    async createTransaction(compteId: number, dto: any, userId: number) {
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
                where: { id: { in: [debitAccount, creditAccount] } }
            });
            if (accountCheck.length !== 2) throw new Error("One or both accounts not found");

            // Create Journal Entry
            // We need a Journal. Let's use GEN (1) for now or maybe CASH (2) if it involves Caisse?
            // If compteId is Caisse, use Caisse Journal.
            const mainAccount = await tx.compte.findUnique({ where: { id: compteId } });
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
                    lines: {
                        create: [
                            {
                                lineNumber: 1,
                                compteId: debitAccount,
                                debit: amount,
                                credit: 0,
                                description
                            },
                            {
                                lineNumber: 2,
                                compteId: creditAccount,
                                debit: 0,
                                credit: amount,
                                description
                            }
                        ]
                    }
                }
            });

            this.socketGateway.emitRefresh();
            return entry;
        });
    }

    async updateTransaction(entryId: number, dto: any, userId: number) {
        const { amount, type, description, contraAccountId, date } = dto;
        const transactionDate = date ? new Date(date) : new Date();
        const mainAccountId = dto.compteId; 

        return this.prisma.$transaction(async (tx) => {
             // 1. Get existing entry with lines
            const existingEntry = await tx.journalEntry.findUnique({
                where: { id: entryId },
                include: { lines: true }
            });

            if (!existingEntry) throw new Error("Transaction not found");

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
                where: { id: { in: [debitAccount, creditAccount] } }
            });
            if (accountCheck.length !== 2) throw new Error("One or both accounts not found");

            // 3. Update Entry Header
            await tx.journalEntry.update({
                where: { id: entryId },
                data: {
                    date: transactionDate,
                    description,
                    totalDebit: amount,
                    totalCredit: amount,
                    // createdBy ? maybe updatedBy?
                }
            });

            // 4. Update Lines
            // Easier to delete and recreate lines? Or update in place?
            // Delete and recreate is safer to ensure correct debit/credit assignment
            await tx.journalLine.deleteMany({
                where: { entryId }
            });

            await tx.journalLine.createMany({
                data: [
                    {
                        entryId,
                        lineNumber: 1,
                        compteId: debitAccount,
                        debit: amount,
                        credit: 0,
                        description
                    },
                    {
                        entryId,
                        lineNumber: 2,
                        compteId: creditAccount,
                        debit: 0,
                        credit: amount,
                        description
                    }
                ]
            });

            this.socketGateway.emitRefresh();
            return { message: "Transaction updated" };
        });
    }

    async deleteTransaction(entryId: number) {
        // Find entry to ensure it exists
        const entry = await this.prisma.journalEntry.findUnique({
            where: { id: entryId }
        });
        
        if (!entry) throw new Error("Transaction not found");

        // Delete Entry (Cascade delete configured? If not, delete lines first)
        // Prisma schema usually handles cascade if defined, but safe manual delete:
        await this.prisma.$transaction(async (tx) => {
            await tx.journalLine.deleteMany({ where: { entryId } });
            await tx.journalEntry.delete({ where: { id: entryId } });
        });
        
        this.socketGateway.emitRefresh();
        return { message: "Transaction deleted" };
    }

    async remove(id: number) {
        const compte = await this.prisma.compte.findUnique({
            where: { id }
        });

        if (!compte) {
            throw new Error("Account Not Exist");
        }

        // For Nested Set, we should ideally update other nodes, but following subject pattern
        await this.prisma.compte.delete({ where: { id } });
        this.socketGateway.emitRefresh();
    }

    // Helper to ensure "Salaires" parent account exists
    async ensureSalaryParentAccount() {
        const salaryAccount = await this.prisma.compte.findFirst({
            where: { 
                code: '63', 
            }
        });

        if (salaryAccount) return salaryAccount;

        // Find Class 6 root
        let class6 = await this.prisma.compte.findFirst({ where: { code: '6' } });

        if (!class6) {
             // Create 'Salaires' at root if 6 missing
             return this.create({
                 name: "Charges de personnel",
                 code: "63",
                 category: "EXPENSE",
                 nature: "EXPENSE",
                 parentId: -1
             } as any);
        }

        return this.create({
            name: "Personnel et comptes rattachés",
            code: "63",
            category: "EXPENSE",
            nature: "EXPENSE",
            parentId: class6.id
        } as any);
    }

    async getOrCreateEmployerAccount(employerId: number, name: string) {
        // Check if account exists for this employer
        const existingAccount = await this.prisma.compte.findFirst({
            where: { employerId }
        });

        if (existingAccount) return existingAccount;

        // Ensure Parent "Salaires" exists
        // Try to find a parent with code 63 or name containing Salaires
        let parent = await this.prisma.compte.findFirst({
             where: { 
                 OR: [
                     { code: { startsWith: '63' } },
                     { name: { contains: 'Salaire', mode: 'insensitive' } },
                     { name: { contains: 'Salary', mode: 'insensitive' } }, // Add English search
                 ]
             }
        });

        if (!parent) {
            // Create Parent
            parent = await this.ensureSalaryParentAccount();
        }

        // Create Employer Account
        // We need to generate a unique code. 
        // Simple strategy: ParentCode + EmployerID (padded?)
        // Let's assume 63 + 00 + ID
        const code = `${parent.code}${employerId.toString().padStart(3, '0')}`;

        // Check if code collision (unlikely but safe)
        const check = await this.prisma.compte.findUnique({ where: { code } });
        if (check) return check; 

        return this.create({
            name: `Salaire - ${name}`,
            code, 
            parentId: parent.id,
            employerId: employerId,
            category: "EXPENSE",
            nature: "EXPENSE"
        } as any);
    }
}
