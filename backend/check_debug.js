
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const caisse = await prisma.compte.findFirst({
      where: { name: { contains: 'Caisse' } },
      select: { id: true, name: true, category: true }
  });
  console.log(`Caisse Account: ID ${caisse?.id}, Name ${caisse?.name}`);

  const entry = await prisma.journalEntry.findFirst({
    orderBy: { id: 'desc' },
    include: { lines: true }
  });
  
  if (!entry) {
      console.log('No Journal Entries.');
  } else {
      console.log(`Last Entry ID: ${entry.id}`);
      entry.lines.forEach(l => {
          console.log(`  Line: Account ${l.compteId}, Cr: ${l.credit}, Dr: ${l.debit}`);
      });
  }
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
