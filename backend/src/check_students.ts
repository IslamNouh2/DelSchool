import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany({
    include: {
      studentClasses: true,
    },
  });
  console.log('Total students in DB:', students.length);
  students.forEach((s) => {
    console.log(
      `- ID: ${s.studentId}, Name: ${s.firstName} ${s.lastName}, Tenant: ${s.tenantId}, Classes: ${s.studentClasses.length}`,
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
