import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('123456', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@gmail.com' },
        update: {},
        create: {
            email: 'admin@gmail.com',
            username: 'admin',
            password: password,
            role: 'ADMIN',
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
        },
    });

    await prisma.parameter.upsert({
        where: { paramId: 1 },
        update: {},
        create: {
            paramId: 1,
            paramName: 'Ok_Sub_subject',
            okActive: false
        },
    });

    await prisma.parent.upsert({
        where: { parentId: 1 },
        update: {},
        create: {
            parentId: 1,
        },
    });

    console.log('Default root subject and compte inserted');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });