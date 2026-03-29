import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { exec } from 'child_process';

const prisma = new PrismaClient();

function runCommand(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { env: process.env }, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      if (error) return reject(error);
      resolve();
    });
  });
}

async function runSeed() {
  const password = await bcrypt.hash('123456', 10);

  // 1. Permissions
  const permissions = [
    { name: 'user:read', description: 'Read users' },
    { name: 'user:create', description: 'Create users' },
    { name: 'user:update', description: 'Update users' },
    { name: 'user:delete', description: 'Delete users' },
    { name: 'role:manage', description: 'Manage roles and permissions' },
    { name: 'audit:read', description: 'Read audit logs' },
    { name: 'grade:read', description: 'Read student grades' },
    { name: 'grade:create', description: 'Create/Post grades' },
    { name: 'subject:read', description: 'Read subjects' },
    { name: 'subject:create', description: 'Manage subjects' },
    { name: 'exam:read', description: 'View exams' },
    { name: 'exam:manage', description: 'Manage exams' },
    { name: 'attendance:read', description: 'View attendance' },
    { name: 'attendance:manage', description: 'Manage attendance' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permissions seeded');

  // 2. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Full system access' },
  });

  const teacherRole = await prisma.role.upsert({
    where: { name: 'TEACHER' },
    update: {},
    create: {
      name: 'TEACHER',
      description: 'Teacher access',
      parentId: adminRole.id,
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: {
      name: 'STUDENT',
      description: 'Student access',
      parentId: teacherRole.id,
    },
  });
  console.log('✅ Roles seeded');

  // 3. Assign all permissions to ADMIN
  const allPermissions = await prisma.permission.findMany();
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: p.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }
  console.log('✅ Role permissions seeded');

  // 4. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { roleId: adminRole.id },
    create: {
      email: 'admin@gmail.com',
      username: 'admin',
      password,
      roleId: adminRole.id,
      tenantId: 'default-tenant',
    },
  });

  await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: { roleId: teacherRole.id },
    create: {
      email: 'teacher@gmail.com',
      username: 'TEA001',
      password,
      roleId: teacherRole.id,
      tenantId: 'default-tenant',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@gmail.com' },
    update: { roleId: studentRole.id },
    create: {
      email: 'student@gmail.com',
      username: 'ST001',
      password,
      roleId: studentRole.id,
      tenantId: 'default-tenant',
    },
  });
  console.log('✅ Users seeded');

  // 5. Base data
  await prisma.subject.upsert({
    where: { subjectId: -1 },
    update: {},
    create: {
      subjectId: -1,
      subjectName: 'subject',
      totalGrads: 0,
      parentId: -1,
      BG: 0,
      BD: 1,
      tenantId: 'default-tenant',
    },
  });

  await prisma.compte.upsert({
    where: { id: -1 },
    update: {},
    create: {
      id: -1,
      name: 'TOUS LES COMPTES',
      parentId: -1,
      BG: 0,
      BD: 1,
      level: 0,
      category: 'GENERAL',
      tenantId: 'default-tenant',
    },
  });

  await prisma.parent.upsert({
    where: { parentId: 1 },
    update: {},
    create: { parentId: 1, tenantId: 'default-tenant' },
  });
  console.log('✅ Base data seeded');

  // 6. Parameters
  const parameters = [
    { paramName: 'Ok_Sub_subject', okActive: false },
    { paramName: 'Transition_Mode', okActive: false },
    { paramName: 'School_System_Paid', okActive: false },
    { paramName: 'Subscription_Individual_Mode', okActive: true },
  ];

  for (const param of parameters) {
    await prisma.parameter.upsert({
      where: { paramName: param.paramName },
      update: {},
      create: { ...param, tenantId: 'default-tenant' },
    });
  }
  console.log('✅ Parameters seeded');

  // 7. School Years
  const currentYear = await prisma.schoolYear.upsert({
    where: { year: '2024-2025' },
    update: {},
    create: {
      year: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true,
      tenantId: 'default-tenant',
    },
  });

  await prisma.schoolYear.upsert({
    where: { year: '2025-2026' },
    update: {},
    create: {
      year: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: false,
      tenantId: 'default-tenant',
    },
  });
  console.log('✅ School years seeded');

  // 8. Local + Classes
  const local = await prisma.local.upsert({
    where: { code: 'MAIN_BLDG' },
    update: {},
    create: {
      name: 'Main Building',
      code: 'MAIN_BLDG',
      NumClass: 10,
      size: 100,
      tenantId: 'default-tenant',
    },
  });

  const classG1A = await prisma.classes.upsert({
    where: { code: 'G1A' },
    update: {},
    create: {
      ClassName: 'Grade 1A',
      code: 'G1A',
      localId: local.localId,
      NumStudent: 30,
      tenantId: 'default-tenant',
    },
  });
  console.log('✅ Local & classes seeded');

  // 9. Teacher profile
  const teacherProfile = await prisma.employer.upsert({
    where: { code: 'TEA001' },
    update: {},
    create: {
      firstName: 'Maitre',
      lastName: 'Test',
      code: 'TEA001',
      type: 'teacher',
      gender: 'M',
      dateOfBirth: new Date('1985-01-01'),
      tenantId: 'default-tenant',
      checkInTime: '08:00',
      checkOutTime: '16:00',
    },
  });

  await prisma.teaherClass.upsert({
    where: { employerId: teacherProfile.employerId },
    update: {},
    create: {
      employerId: teacherProfile.employerId,
      classId: classG1A.classId,
      isCurrent: true,
      tenantId: 'default-tenant',
    },
  });
  console.log('✅ Teacher seeded');

  // 10. Student
  const student = await prisma.student.upsert({
    where: { code: 'ST001' },
    update: {},
    create: {
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: new Date('2018-05-20'),
      gender: 'M',
      address: '123 Rue de la Paix',
      code: 'ST001',
      dateInscription: new Date(),
      parentId: 1,
      tenantId: 'default-tenant',
    },
  });

  const studentClass = await prisma.studentClass.upsert({
    where: {
      studentId_schoolYearId: {
        studentId: student.studentId,
        schoolYearId: currentYear.id,
      },
    },
    update: {},
    create: {
      studentId: student.studentId,
      classId: classG1A.classId,
      schoolYearId: currentYear.id,
      isCurrent: true,
      tenantId: 'default-tenant',
    },
  });

  const exam = await prisma.exam.create({
    data: {
      examName: 'Midterm',
      dateStart: new Date(),
      dateEnd: new Date(),
      publish: true,
      tenantId: 'default-tenant',
    },
  });

  await prisma.grads.create({
    data: {
      grads: 15,
      examId: exam.id,
      studentClassId: studentClass.id,
      subjectId: -1,
      tenantId: 'default-tenant',
    },
  });
  console.log('✅ Student seeded');

  // 11. Journals
  const journals = [
    { code: 'GEN', name: 'Journal Général', type: 'GENERAL' as const },
    { code: 'CASH', name: 'Journal de Caisse', type: 'CASH' as const },
    { code: 'BANK', name: 'Journal de Banque', type: 'BANK' as const },
  ];

  for (const j of journals) {
    await prisma.journal.upsert({
      where: { code: j.code },
      update: {},
      create: { ...j, createdBy: admin.id, tenantId: 'default-tenant' },
    });
  }
  console.log('✅ Journals seeded');

  // 12. Comptes
  const comptes = [
    { id: 4, name: 'CLIENTS - ÉLÈVES (CRÉANCES)', BG: 1, BD: 2 },
    { id: 5, name: 'PRODUITS DES FRAIS SCOLAIRES', BG: 3, BD: 4 },
    { id: 6, name: 'CAISSE CENTRALE', BG: 5, BD: 6 },
  ];

  for (const c of comptes) {
    await prisma.compte.upsert({
      where: { id: c.id },
      update: {},
      create: {
        ...c,
        parentId: -1,
        level: 1,
        category: 'GENERAL',
        isPosted: true,
        tenantId: 'default-tenant',
      },
    });
  }
  console.log('✅ Comptes seeded');
}

async function main() {
  try {
    console.log('🚀 Running migrations...');
    await runCommand('npx prisma migrate deploy');
    console.log('✅ Migrations completed');

    console.log('🌱 Seeding database...');
    await runSeed();

    console.log('🎉 Deploy and seed completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
