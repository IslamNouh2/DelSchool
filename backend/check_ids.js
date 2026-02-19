
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const caisses = await prisma.compte.findMany({
      where: { name: { contains: 'Caisse' } },
      select: { id: true, name: true, category: true }
  });
  console.log('All Caisse Accounts:', caisses);

  const account4 = await prisma.compte.findUnique({
      where: { id: 4 },
      select: { id: true, name: true, category: true }
  });
  console.log('Account 4:', account4);
  
  const account2 = await prisma.compte.findUnique({
      where: { id: 2 },
      select: { id: true, name: true, category: true }
  });
  console.log('Account 2:', account2);
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
