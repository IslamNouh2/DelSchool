
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const account6 = await prisma.compte.findFirst({
      where: { code: { startsWith: '6' } },
      select: { id: true, code: true, name: true }
  });
  console.log('Expense Account found:', account6);

  const entries = await prisma.journalEntry.findMany({
    take: 3,
    orderBy: { id: 'desc' },
    include: { lines: true }
  });
  
  if (entries.length === 0) {
      console.log('No Journal Entries found.');
  } else {
      entries.forEach(e => {
          console.log(`Entry ID: ${e.id}, Ref: ${e.referenceType} ${e.referenceId}, Debit: ${e.totalDebit}`);
          e.lines.forEach(l => {
              console.log(`  Line: Account ${l.compteId}, Debit: ${l.debit}, Credit: ${l.credit}`);
          });
      });
  }

  const payrolls = await prisma.payroll.findMany({
      take: 1,
      orderBy: { id: 'desc' }
  });
  console.log('Last Payroll:', payrolls[0] ? `ID ${payrolls[0].id} Status ${payrolls[0].status}` : 'None');
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
