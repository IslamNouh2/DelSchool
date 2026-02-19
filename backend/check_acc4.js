
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const acc4 = await prisma.compte.findUnique({
      where: { id: 4 },
      select: { id: true, name: true, category: true }
  });
  console.log(`Account 4: ${acc4 ? acc4.name : 'Not Found'} (${acc4 ? acc4.category : ''})`);
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
