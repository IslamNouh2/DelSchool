import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class TimetableOptimizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SystemSettingsService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async generateAI(tenantId: string, academicYear: string) {
    // 1. Fetch data
    const [settings, teachers, classesData, subjects, slots, teacherSubjects, teacherClasses] = await Promise.all([
      this.settingsService.getSettings(tenantId),
      this.prisma.employer.findMany({ where: { tenantId, type: 'teacher' } }),
      this.prisma.classes.findMany({
        where: { tenantId },
        include: {
          local: {
            include: {
              subject_local: true,
            },
          },
        },
      }),
      this.prisma.subject.findMany({ where: { tenantId } }),
      this.prisma.timeSlot.findMany({ 
        where: { tenantId },
        orderBy: { startTime: 'asc' }
      }),
      this.prisma.teacherSubject.findMany({ where: { tenantId } }),
      this.prisma.teaherClass.findMany({ where: { tenantId } }),
    ]);

    // 2. Prepare Payload
    const classWeeklyHours = classesData.map((cls) => ({
      classId: cls.classId,
      maxSlotsPerWeek: cls.local?.weeklyHours ?? 6,
    }));

    const subjectRequirements = [];
    classesData.forEach((cls) => {
      if (cls.local) {
        cls.local.subject_local.forEach((sl) => {
          subjectRequirements.push({
            classId: cls.classId,
            subjectId: sl.subjectId,
          });
        });
      }
    });

    const payload = {
      teachers: teachers.map((t) => ({
        id: t.employerId,
        name: `${t.firstName} ${t.lastName}`,
        weeklyWorkload: t.weeklyWorkload ?? 20,
      })),
      classes: classesData.map((c) => ({ id: c.classId, name: c.ClassName })),
      subjects: subjects.map((s) => {
          const n = s.subjectName.toLowerCase();
          const isBreak = n.includes("break") || n.includes("lunch") || n.includes("pause") || n.includes("استراحة");
          return { id: s.subjectId, name: s.subjectName, isBreak };
      }),
      slots: slots.map((s) => ({ id: s.id, start: s.startTime, end: s.endTime })),
      teacherAssignments: teachers.map((t) => ({
        teacherId: t.employerId,
        subjectIds: teacherSubjects
          .filter((ts) => ts.employerId === t.employerId)
          .map((ts) => ts.subjectId),
        classIds: teacherClasses
          .filter((tc) => tc.employerId === t.employerId)
          .map((tc) => tc.classId),
      })),
      classWeeklyHours,
      subjectRequirements,
      academicYear,
      weekStartDay: settings.weekStartDay,
      firstSlotId: null, // Can be extended if needed
    };

    // 3. Call AI microservice
    let aiResponse: Response;
    try {
      aiResponse = await fetch('http://127.0.0.1:8000/api/v1/timetable/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (connError) {
      throw new BadRequestException('Could not connect to AI microservice.');
    }

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      throw new BadRequestException(`AI service error: ${errBody}`);
    }

    const aiResult = await aiResponse.json();

    // 4. Save Results
    await this.prisma.$transaction(async (tx) => {
      // Clear existing AI-generated slots
      await tx.timetable.deleteMany({
        where: { tenantId, academicYear, mode: 'AI_GENERATED' },
      });

      if (aiResult.timetable && aiResult.timetable.length > 0) {
        await tx.timetable.createMany({
          data: aiResult.timetable.map((slot) => ({
            ...slot,
            tenantId,
            academicYear,
            mode: 'AI_GENERATED',
            aiOptimizationScore: aiResult.optimizationScore || 0,
            aiGeneratedAt: new Date(),
          })),
        });
      }
    });

    this.socketGateway.emitRefresh();

    return {
        success: true,
        lessonsPlaced: aiResult.timetable?.length || 0,
        optimizationScore: (aiResult.optimizationScore || 0) * 100,
        status: aiResult.status,
    };
  }
}
