const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');

const prisma = new PrismaClient();

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);
      if (error) return reject(error);
      resolve();
    });
  });
}

async function runSeed() {
  try {
    const password = await bcrypt.hash('123456', 10);

    // Wrap each upsert in try/catch to prevent failure if table missing
    try {
      await prisma.user.upsert({
        where: { email: 'admin@gmail.com' },
        update: {},
        create: {
          email: 'admin@gmail.com',
          username: 'admin',
          password,
          role: 'ADMIN',
        },
      });
    } catch (e) {
      console.warn('Skipping user seed (table may not exist yet):', e.message);
    }

    try {
      await prisma.subject.upsert({
        where: { subjectId: -1 },
        update: {},
        create: { subjectId: -1, subjectName: 'subject', totalGrads: 0, parentId: -1, BG: 0, BD: 1 },
      });
    } catch (e) {
      console.warn('Skipping subject seed:', e.message);
    }

    try {
      await prisma.compte.upsert({
        where: { id: -1 },
        update: {},
        create: { id: -1, name: 'TOUS LES COMPTES', parentId: -1, BG: 0, BD: 1, level: 0 },
      });
    } catch (e) {
      console.warn('Skipping compte seed:', e.message);
    }

    try {
      await prisma.parameter.upsert({
        where: { paramId: 1 },
        update: {},
        create: { paramId: 1, paramName: 'Ok_Sub_subject', okActive: false },
      });
    } catch (e) {
      console.warn('Skipping parameter seed:', e.message);
    }

    try {
      await prisma.parent.upsert({
        where: { parentId: 1 },
        update: {},
        create: { parentId: 1 },
      });
    } catch (e) {
      console.warn('Skipping parent seed:', e.message);
    }

    console.log('✅ Default seeds inserted (if tables exist)');
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    console.log('Running migrations...');
    await runCommand('npx prisma migrate deploy');

    console.log('Seeding database...');
    await runSeed();

    console.log('✅ Migrations and seed completed!');
  } catch (err) {
    console.error('Error in deploy-and-seed:', err);
    process.exit(1);
  }
}

main();
