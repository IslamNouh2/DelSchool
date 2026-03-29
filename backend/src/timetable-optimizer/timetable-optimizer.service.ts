import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { SocketGateway } from '../socket/socket.gateway';
import { TimetableMode } from '@prisma/client';

interface AITimetableSlot {
  day: string;
  classId: number;
  subjectId: number;
  timeSlotId: number;
  employerId: number | null;
}

interface AIResponse {
  timetable: AITimetableSlot[];
  optimizationScore: number;
  status: string;
}

@Injectable()
export class TimetableOptimizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SystemSettingsService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async generateAI(academicYear: string, tenantId: string) {
    // 1. Fetch data
    const [
      settings,
      teachers,
      classesData,
      subjects,
      slots,
      teacherSubjects,
      teacherClasses,
    ] = await Promise.all([
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
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.teacherSubject.findMany({ where: { tenantId } }),
      this.prisma.teaherClass.findMany({ where: { tenantId } }),
    ]);

    // 2. Prepare Payload
    const classWeeklyHours = classesData.map((cls) => ({
      classId: cls.classId,
      maxSlotsPerWeek: cls.local?.weeklyHours ?? 6,
    }));

    const subjectRequirements = classesData.flatMap((cls) => {
      if (cls.local) {
        return cls.local.subject_local.map((sl) => ({
          classId: cls.classId,
          subjectId: sl.subjectId,
        }));
      }
      return [];
    });

    const payload = {
      teachers: teachers.map((t) => ({
        id: t.employerId,
        name: `${t.firstName} ${t.lastName}`,
        weeklyWorkload: t.weeklyWorkload,
      })),
      classes: classesData.map((c) => ({ id: c.classId, name: c.ClassName })),
      subjects: subjects.map((s) => {
        const n = s.subjectName.toLowerCase();
        const isBreak =
          n.includes('break') ||
          n.includes('lunch') ||
          n.includes('pause') ||
          n.includes('استراحة');
        return { id: s.subjectId, name: s.subjectName, isBreak };
      }),
      slots: slots.map((s) => ({
        id: s.id,
        start: s.startTime,
        end: s.endTime,
      })),
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
    };

    // 3. Call AI microservice
    let aiResponse: Response;
    try {
      aiResponse = await fetch(
        'http://127.0.0.1:8000/api/v1/timetable/optimize',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
    } catch (error: any) {
      throw new BadRequestException(
        `AI Service connection failed: ${(error as Error).message}`,
      );
    }

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      throw new BadRequestException(`AI Optimizer Error: ${errBody}`);
    }

    const aiResult = (await aiResponse.json()) as AIResponse;

    // 4. Save Results
    await this.prisma.$transaction(async (tx) => {
      // Clear all existing slots for this academic year and tenant to avoid unique constraint violations
      await tx.timetable.deleteMany({
        where: { tenantId, academicYear },
      });

      if (aiResult.timetable && aiResult.timetable.length > 0) {
        await tx.timetable.createMany({
          data: aiResult.timetable.map((slot: AITimetableSlot) => ({
            ...slot,
            tenantId,
            academicYear,
            mode: 'AI_GENERATED' as TimetableMode,
            aiOptimizationScore: aiResult.optimizationScore || 0,
            aiGeneratedAt: new Date(),
          })),
        });
      }
    });

    this.socketGateway.emitRefresh();

    return {
      message: 'Timetable generated successfully',
      lessonsPlaced: aiResult.timetable.length,
      score: aiResult.optimizationScore,
      status: aiResult.status,
    };
  }
}
