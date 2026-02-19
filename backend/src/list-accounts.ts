
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const journals = await prisma.journal.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
    }
  });
  // Hardcode check
  console.log("JOURNALS:");
  for (const j of journals) {
     console.log(`${j.id}:${j.code}:${j.type}`); 
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
