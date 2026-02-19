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
            category: 'GENERAL',
        },
    });

    await prisma.parameter.upsert({
        where: { paramName: 'Ok_Sub_subject' },
        update: {},
        create: {
            paramName: 'Ok_Sub_subject',
            okActive: false
        },
    });

    await prisma.parameter.upsert({
        where: { paramName: 'Transition_Mode' },
        update: {},
        create: {
            paramName: 'Transition_Mode',
            okActive: false
        },
    });

    await prisma.parameter.upsert({
        where: { paramName: 'School_System_Paid' },
        update: {},
        create: {
            paramName: 'School_System_Paid',
            okActive: false
        },
    });

    await prisma.parameter.upsert({
        where: { paramName: 'Subscription_Individual_Mode' },
        update: {},
        create: {
            paramName: 'Subscription_Individual_Mode',
            okActive: true
        },
    });

    await prisma.parent.upsert({
        where: { parentId: 1 },
        update: {},
        create: {
            parentId: 1,
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
            isCurrent: true
        }
    });

    await prisma.schoolYear.upsert({
        where: { year: '2025-2026' },
        update: {},
        create: {
            year: '2025-2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-06-30'),
            isCurrent: false
        }
    });

    const local = await prisma.local.upsert({
        where: { code: 'MAIN_BLDG' },
        update: {},
        create: {
            name: 'Main Building',
            code: 'MAIN_BLDG',
            NumClass: 10,
            size: 100
        }
    });

    const classG1A = await prisma.classes.upsert({
        where: { code: 'G1A' },
        update: {},
        create: {
            ClassName: 'Grade 1A',
            code: 'G1A',
            localId: local.localId,
            NumStudent: 30
        }
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
            parentId: 1 // Link to the created parent
        }
    });

    // Assign student to current class
    const studentClass = await prisma.studentClass.upsert({
        where: {
            studentId_schoolYearId: {
                studentId: student.studentId,
                schoolYearId: currentYear.id
            }
        },
        update: {},
        create: {
            studentId: student.studentId,
            classId: classG1A.classId,
            schoolYearId: currentYear.id,
            isCurrent: true
        }
    });

    // Give some grads average >= 10
    await prisma.grads.create({
        data: {
            grads: 15,
            examId: (await prisma.exam.create({ 
                data: { examName: 'Midterm', dateStart: new Date(), dateEnd: new Date(), publish: true } 
            })).id,
            studentClassId: studentClass.id,
            subjectId: -1 // Root subject
        }
    });

    // Create Journals
    const generalJournal = await prisma.journal.upsert({
        where: { code: 'GEN' },
        update: {},
        create: {
            code: 'GEN',
            name: 'Journal Général',
            type: 'GENERAL',
            createdBy: admin.id
        }
    });

    await prisma.journal.upsert({
        where: { code: 'CASH' },
        update: {},
        create: {
            code: 'CASH',
            name: 'Journal de Caisse',
            type: 'CASH',
            createdBy: admin.id
        }
    });

    await prisma.journal.upsert({
        where: { code: 'BANK' },
        update: {},
        create: {
            code: 'BANK',
            name: 'Journal de Banque',
            type: 'BANK',
            createdBy: admin.id
        }
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
            isPosted: true
        }
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
            isPosted: true
        }
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
            isPosted: true
        }
    });

    console.log('Default journals, accounts, root subject, school years, sample locations, and student with grades inserted');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
