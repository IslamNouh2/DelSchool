import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSettings.findMany();
  console.log('System Settings:', JSON.stringify(settings, null, 2));

  const employers = await prisma.employer.findMany({ select: { tenantId: true }, take: 5 });
  console.log('Sample Employer Tenants:', employers);

  const users = await prisma.user.findMany({ select: { tenantId: true }, take: 5 });
  console.log('Sample User Tenants:', users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
