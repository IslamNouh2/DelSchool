import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStudentRisk(studentId: number) {
    // 1. Fetch student data
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      include: { riskProfile: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found.`);
    }

    // Default features if no profile exists
    const attendance = student.riskProfile?.attendance ?? 0;
    const averageGrade = student.riskProfile?.averageGrade ?? 0;
    const behaviorScore = student.riskProfile?.behaviorScore ?? 0;
    const homeworkCompletion = student.riskProfile?.homeworkCompletion ?? 0;

    // 2. Prepare payload for ML service
    const payload = {
      attendance,
      averageGrade,
      behaviorScore,
      homeworkCompletion,
    };

    // 3. Send HTTP request to Python microservice
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`ML service returned error: ${response.statusText}`);
      }

      const data = await response.json();
      const riskLevel = data.riskLevel;
      const recommendation = data.recommendation;

      // 4. Update the riskLevel field in the Prisma database
      const updatedProfile = await this.prisma.studentRiskProfile.upsert({
        where: { studentId },
        create: {
          studentId,
          tenantId: student.tenantId,
          attendance,
          averageGrade,
          behaviorScore,
          homeworkCompletion,
          riskLevel,
          recommendation,
          lastCalculatedAt: new Date(),
        },
        update: {
          riskLevel,
          recommendation,
          lastCalculatedAt: new Date(),
        },
      });

      // 5. Return JSON
      return {
        studentId: studentId,
        riskLevel: updatedProfile.riskLevel,
        recommendation: updatedProfile.recommendation,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to connect to AI engine: ${error.message}. Ensure the ML service is running on http://127.0.0.1:8000`);
    }
  }

  async getStudentRisk(studentId: number) {
    const profile = await this.prisma.studentRiskProfile.findUnique({
      where: { studentId },
    });

    if (!profile) {
      throw new NotFoundException(`Risk profile for student ${studentId} not found. Run POST first to generate it.`);
    }

    return {
      studentId: studentId,
      riskLevel: profile.riskLevel,
      recommendation: profile.recommendation,
      lastCalculatedAt: profile.lastCalculatedAt,
    };
  }
}
