const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const settings = await prisma.systemSettings.findFirst();
  console.log('--- System Settings ---');
  console.log(JSON.stringify(settings, null, 2));

  const slots = await prisma.timeSlot.findMany({
    orderBy: { startTime: 'asc' }
  });
  console.log('\n--- Time Slots ---');
  console.log(JSON.stringify(slots, null, 2));
}

check().finally(() => prisma.$disconnect());
