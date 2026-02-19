
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTransaction() {
  console.log('Starting Transaction Fix...');

  // 1. Verify Caisse 01 is ID 2
  const caisse = await prisma.compte.findUnique({ where: { id: 2 } });
  if (!caisse || !caisse.name.includes('Caisse')) {
      console.error('Account ID 2 is not Caisse. Aborting.');
      return;
  }
  console.log(`Confirmed Target Account: ${caisse.name} (ID: 2)`);

  // 2. Find the Journal Entry with Account 4 (Food) - likely the last one
  // We look for a JournalLine with credit > 0 linked to Account 4 created recently
  const incorrectLine = await prisma.journalLine.findFirst({
      where: {
          compteId: 4,
          credit: { gt: 0 }
      },
      orderBy: { id: 'desc' },
      include: { entry: true }
  });

  if (!incorrectLine) {
      console.log('No incorrect transaction found in Account 4.');
      return;
  }

  console.log(`Found Incorrect Line: ID ${incorrectLine.id}, Amount ${incorrectLine.credit} for Entry ${incorrectLine.entry.referenceType} ${incorrectLine.entry.referenceId}`);

  // 3. Update the line to point to ID 2
  const updated = await prisma.journalLine.update({
      where: { id: incorrectLine.id },
      data: { compteId: 2 }
  });

  console.log(`Successfully moved transaction to Account 2 (Caisse 01). New Line details:`, updated);
}

fixTransaction()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
