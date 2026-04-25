import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as process from 'process';
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);
  // 1. Create permissions
  const permissions = [
    { name: 'user:read', description: 'Read users' },
    { name: 'user:create', description: 'Create users' },
    { name: 'user:update', description: 'Update users' },
    { name: 'user:delete', description: 'Delete users' },
    { name: 'role:manage', description: 'Manage roles and permissions' },
    { name: 'audit:read', description: 'Read audit logs' },
    // New granular permissions
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

  // 2. Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Full system access',
    },
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

  // 3. Assign all permissions to ADMIN role
  const allPermissions = await prisma.permission.findMany();
  for (const p of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: p.id,
      },
    });
  }

  // 4. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      roleId: adminRole.id,
    },
    create: {
      email: 'admin@gmail.com',
      username: 'admin',
      password: password,
      roleId: adminRole.id,
      tenantId: 'default-tenant',
    },
  });

  await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: {
      roleId: teacherRole.id,
    },
    create: {
      email: 'teacher@gmail.com',
      username: 'TEA001',
      password: password,
      roleId: teacherRole.id,
      tenantId: 'default-tenant',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@gmail.com' },
    update: {
      roleId: studentRole.id,
    },
    create: {
      email: 'student@gmail.com',
      username: 'ST001',
      password: password,
      roleId: studentRole.id,
      tenantId: 'default-tenant',
    },
  });

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

  await prisma.parameter.upsert({
    where: { paramName: 'Ok_Sub_subject' },
    update: {},
    create: {
      paramName: 'Ok_Sub_subject',
      okActive: false,
      tenantId: 'default-tenant',
    },
  });

  await prisma.parameter.upsert({
    where: { paramName: 'Transition_Mode' },
    update: {},
    create: {
      paramName: 'Transition_Mode',
      okActive: false,
      tenantId: 'default-tenant',
    },
  });

  await prisma.parameter.upsert({
    where: { paramName: 'School_System_Paid' },
    update: {},
    create: {
      paramName: 'School_System_Paid',
      okActive: false,
      tenantId: 'default-tenant',
    },
  });

  await prisma.parameter.upsert({
    where: { paramName: 'Subscription_Individual_Mode' },
    update: {},
    create: {
      paramName: 'Subscription_Individual_Mode',
      okActive: true,
      tenantId: 'default-tenant',
    },
  });

  await prisma.parent.upsert({
    where: { parentId: 1 },
    update: {},
    create: {
      parentId: 1,
      tenantId: 'default-tenant',
    },
  });

  // Sample Data for Testing
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

  // Create a sample teacher profile
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

  // Assign teacher to class
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

  // Create a sample student
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
      parentId: 1, // Link to the created parent
      tenantId: 'default-tenant',
    },
  });

  // Assign student to current class
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

  // Give some grads average >= 10
  await prisma.grads.create({
    data: {
      grads: 15,
      examId: (
        await prisma.exam.create({
          data: {
            examName: 'Midterm',
            dateStart: new Date(),
            dateEnd: new Date(),
            publish: true,
            tenantId: 'default-tenant',
          },
        })
      ).id,
      studentClassId: studentClass.id,
      subjectId: -1, // Root subject
      tenantId: 'default-tenant',
    },
  });

  // Create Journals
  await prisma.journal.upsert({
    where: { code: 'GEN' },
    update: {},
    create: {
      code: 'GEN',
      name: 'Journal Général',
      type: 'GENERAL',
      createdBy: admin.id,
      tenantId: 'default-tenant',
    },
  });

  await prisma.journal.upsert({
    where: { code: 'CASH' },
    update: {},
    create: {
      code: 'CASH',
      name: 'Journal de Caisse',
      type: 'CASH',
      createdBy: admin.id,
      tenantId: 'default-tenant',
    },
  });

  await prisma.journal.upsert({
    where: { code: 'BANK' },
    update: {},
    create: {
      code: 'BANK',
      name: 'Journal de Banque',
      type: 'BANK',
      createdBy: admin.id,
      tenantId: 'default-tenant',
    },
  });

  // Create Base Accounts (Comptes)
  // 411 - Student Receivables
  await prisma.compte.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'CLIENTS - ÉLÈVES (CRÉANCES)',
      parentId: -1,
      BG: 1,
      BD: 2,
      level: 1,
      category: 'GENERAL',
      isPosted: true,
      tenantId: 'default-tenant',
    },
  });

  // 706 - Student Fee Income
  await prisma.compte.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: 'PRODUITS DES FRAIS SCOLAIRES',
      parentId: -1,
      BG: 3,
      BD: 4,
      level: 1,
      category: 'GENERAL',
      isPosted: true,
      tenantId: 'default-tenant',
    },
  });

  // 531 - Cash
  await prisma.compte.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      name: 'CAISSE CENTRALE',
      parentId: -1,
      BG: 5,
      BD: 6,
      level: 1,
      category: 'GENERAL',
      isPosted: true,
      tenantId: 'default-tenant',
    },
  });

  console.log(
    'Default journals, accounts, root subject, school years, sample locations, and student with grades inserted',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
