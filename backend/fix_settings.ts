import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing SystemSettings...');
  await prisma.systemSettings.deleteMany();
  console.log('SystemSettings cleared.');
  
  // Optional: Create a default one for 'tenant-1' to be safe
  await prisma.systemSettings.create({
    data: {
      tenantId: 'tenant-1',
      weekStartDay: 'SUNDAY',
    }
  });
  console.log('Default settings for tenant-1 created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
