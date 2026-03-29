import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateTeacher(teacherId: number) {
    // 1. Fetch teacher and related data
    const teacher = await this.prisma.employer.findUnique({
      where: { employerId: teacherId },
      include: {
        Timetables: true,
        Teachersubjects: {
          include: {
            subject: {
              include: {
                grads: {
                  include: {
                    studentClass: {
                      include: {
                        Student: {
                          include: {
                            studentAttendance: true,
                            riskProfile: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        TeacherCalsses: {
          include: {
            Class: {
              include: {
                studentClasses: {
                  include: {
                    Student: {
                      include: {
                        studentAttendance: true,
                        riskProfile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found.`);
    }

    // 2. Build Features
    const features = await this.buildFeatures(teacher);

    // 3. Call AI Service
    const aiResult = await this.callAiService(features);

    // 4. Store Snapshot
    const evaluation = await this.prisma.teacherEvaluation.create({
      data: {
        teacherId,
        score: aiResult.score,
        improvementProbability: aiResult.improvementProbability,
        weakAreas: aiResult.weakAreas,
        trainingPlan: aiResult.trainingPlan,
        tenantId: teacher.tenantId,
      },
    });

    return evaluation;
  }

  private async buildFeatures(teacher: any): Promise<number[]> {
    // Feature 0: avg_student_grade
    let totalGrades = 0;
    let gradeCount = 0;

    // Feature 1: grade_improvement_rate
    // Compare latest exam grades with previous ones (simplified)

    // Feature 2: attendance_stability
    let totalAttendanceRatio = 0;
    let studentCount = 0;

    // Feature 3: behaviorScore (proxy for discipline)
    let totalBehaviorScore = 0;

    // Feature 4: workload_hours
    const workloadHours = teacher.weeklyWorkload || 20;

    // Feature 5: assignment_completion_rate
    let totalHomeworkCompletion = 0;

    const students = new Map<number, any>();

    // Collect all students taught by this teacher
    if (teacher.TeacherCalsses?.Class?.studentClasses) {
      for (const sc of teacher.TeacherCalsses.Class.studentClasses) {
        students.set(sc.studentId, sc.Student);
      }
    }

    for (const ts of teacher.Teachersubjects) {
      if (ts.subject.grads) {
        for (const g of ts.subject.grads) {
          totalGrades += g.grads;
          gradeCount++;
        }
      }
    }

    for (const student of students.values()) {
      studentCount++;
      if (student.riskProfile) {
        totalBehaviorScore += student.riskProfile.behaviorScore || 0;
        totalHomeworkCompletion += student.riskProfile.homeworkCompletion || 0;
      }

      const attendance = student.studentAttendance || [];
      if (attendance.length > 0) {
        const presentCount = attendance.filter(
          (a: any) => a.status === 'PRESENT' || a.status === 'LATE',
        ).length;
        totalAttendanceRatio += presentCount / attendance.length;
      } else {
        totalAttendanceRatio += 1.0; // Assume perfect if no data
      }
    }

    const avgGrade = gradeCount > 0 ? totalGrades / gradeCount : 70;
    const avgAttendance =
      studentCount > 0 ? totalAttendanceRatio / studentCount : 0.9;
    const avgBehavior =
      studentCount > 0 ? totalBehaviorScore / studentCount : 80;
    const avgHomework =
      studentCount > 0 ? totalHomeworkCompletion / studentCount : 0.8;

    // Simplified improvement rate
    const improvementRate = 2.0; // Metric: % increase

    return [
      avgGrade, // 0
      improvementRate, // 1
      avgAttendance, // 2
      avgBehavior, // 3
      workloadHours, // 4
      avgHomework, // 5
    ];
  }

  private async callAiService(features: number[]) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to connect to AI engine: ${error.message}`,
      );
    }
  }

  async getTeacherEvaluations(teacherId: number) {
    return this.prisma.teacherEvaluation.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
