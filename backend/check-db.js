const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
    const classes = await prisma.classes.findMany({ include: { local: true } });
    const teachers = await prisma.employer.findMany({ where: { type: 'teacher' } });
    const localSubjects = await prisma.subject_local.findMany();
    const ts = await prisma.teacherSubject.findMany();
    const tc = await prisma.teaherClass.findMany();

    console.log(JSON.stringify({
        classesCount: classes.length,
        teachersCount: teachers.length,
        localSubjectsCount: localSubjects.length,
        teacherSubjectsCount: ts.length,
        teacherClassesCount: tc.length,
        firstClassLocalHours: classes[0]?.local?.weeklyHours,
        firstTeacherWorkload: teachers[0]?.weeklyWorkload,
    }, null, 2));

    await prisma.$disconnect();
}
checkDB();
