import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReportCardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateReportCard(
    tenantId: string,
    studentId: number,
    examId?: number,
    semesterId?: number,
  ) {
    // 1. Fetch Student Info
    const student = await this.prisma.student.findFirst({
      where: { studentId, tenantId },
      include: {
        parent: true,
        studentClasses: {
          where: { isCurrent: true },
          include: {
            Class: { include: { local: true } },
            schoolYear: true,
          },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const currentClass = student.studentClasses[0]?.Class;
    if (!currentClass)
      throw new NotFoundException('Student is not enrolled in any class');

    // 2. Fetch Timeframe (Exam, Semester, or Full Year)
    let dateStart: Date,
      dateEnd: Date,
      reportName: string,
      semesterIdToUse = semesterId;

    if (examId) {
      const exam = await this.prisma.exam.findFirst({
        where: { id: examId, tenantId },
      });
      if (!exam) throw new NotFoundException('Exam not found');
      dateStart = exam.dateStart;
      dateEnd = exam.dateEnd;
      reportName = exam.examName;
      semesterIdToUse = semesterId || exam.semesterId;
    } else if (semesterId) {
      const semester = await this.prisma.semester.findFirst({
        where: { id: semesterId, tenantId },
      });
      if (!semester) throw new NotFoundException('Semester not found');
      dateStart = semester.startDate;
      dateEnd = semester.endDate;
      reportName = semester.name;
    } else {
      // Find latest semester for the current school year
      const latestSemester = await this.prisma.semester.findFirst({
        where: {
          tenantId,
          schoolYear: { id: student.studentClasses[0].schoolYearId },
        },
        orderBy: { startDate: 'desc' },
      });

      if (latestSemester) {
        dateStart = latestSemester.startDate;
        dateEnd = latestSemester.endDate;
        reportName = latestSemester.name;
        semesterIdToUse = latestSemester.id;
      } else {
        dateStart = student.studentClasses[0].schoolYear.startDate;
        dateEnd = student.studentClasses[0].schoolYear.endDate;
        reportName = 'السنة الدراسية الكاملة';
      }
    }

    // 3. Fetch All Subjects linked to this class's local
    const allSubjects = await this.prisma.subject.findMany({
      where: {
        tenantId,
        subject_local: {
          some: { localId: currentClass.localId },
        },
      },
      include: {
        children: true,
        parent: true,
      },
    });

    // 4. Fetch Grades
    const grades = await this.prisma.grads.findMany({
      where: {
        tenantId,
        studentClass: { studentId },
        exam: semesterIdToUse
          ? { semesterId: semesterIdToUse }
          : examId
            ? { id: examId }
            : {},
      },
      include: { exam: true, subject: true },
    });

    // 5. Fetch Semester Exams for headers
    const semesterExams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        ...(semesterIdToUse
          ? { semesterId: semesterIdToUse }
          : examId
            ? { id: examId }
            : {}),
      },
      orderBy: { dateStart: 'asc' },
    });

    // 6. Aggregate Hierarchy with multi-exam and weighted coefficients
    const reportSubjects = await this.buildSubjectHierarchy(
      allSubjects,
      grades,
      semesterExams,
    );

    // 7. Calculate Totals (Weighted)
    const totalAverage = this.calculateWeightedTotalAverage(reportSubjects);

    // 8. Attendance Summary
    const attendance = await this.getAttendanceSummary(
      tenantId,
      studentId,
      dateStart,
      dateEnd,
    );

    // 9. Behavior Summary
    const behavior = await this.getBehaviorSummary(tenantId, studentId);

    // 10. AI Recommendations (Local Analysis)
    const aiRecommendations = await this.getAIRecommendations(reportSubjects);

    // 11. Visualizations
    const visualization = this.generateVisualizationData(
      reportSubjects,
      attendance,
      semesterExams,
    );

    return {
      studentInfo: {
        id: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        code: student.code,
        class: currentClass.ClassName,
        parentContact:
          student.parent.fatherNumber || student.parent.motherNumber,
      },
      schoolInfo: {
        name: 'DelSchool',
        academicYear: student.studentClasses[0].schoolYear.year,
        semester: reportName,
      },
      semesterInfo: {
        id: semesterIdToUse,
        name: reportName,
        startDate: dateStart,
        endDate: dateEnd,
      },
      subjects: reportSubjects,
      totalAverage,
      attendanceSummary: attendance,
      behaviorSummary: behavior,
      aiRecommendations,
      visualization,
      exams: semesterExams.map((e) => ({ name: e.examName, id: e.id })),
    };
  }

  async generateBatchReportCards(
    tenantId: string,
    classId: number,
    semesterId?: number,
  ) {
    const students = await this.prisma.studentClass.findMany({
      where: { classId, tenantId, isCurrent: true },
      select: { studentId: true },
    });

    const reports = [];
    for (const s of students) {
      try {
        const report = await this.generateReportCard(
          tenantId,
          s.studentId,
          undefined,
          semesterId,
        );
        reports.push(report);
      } catch (e) {
        console.error(
          `Error generating report for student ${s.studentId}:`,
          e.message,
        );
      }
    }
    return reports;
  }

  private async buildSubjectHierarchy(
    allSubjects: any[],
    grades: any[],
    exams: any[],
  ) {
    const classSubjectIds = new Set(allSubjects.map((s) => s.subjectId));
    const roots = allSubjects.filter(
      (s) => s.parentId === -1 || !classSubjectIds.has(s.parentId),
    );

    const buildNode = (subject: any) => {
      const children = allSubjects.filter(
        (s) => s.parentId === subject.subjectId,
      );
      const subjectGrades = grades.filter(
        (g) => g.subjectId === subject.subjectId,
      );

      // Group by exam
      const examScores = exams.map((e) => {
        const grade = subjectGrades.find((g) => g.examId === e.id);
        return {
          examType: e.examName,
          score: grade ? grade.grads : null,
        };
      });

      let subjectScore = 0;
      const validScores = examScores.filter((es) => es.score !== null);
      if (validScores.length > 0) {
        subjectScore =
          validScores.reduce((acc, curr) => acc + curr.score, 0) /
          validScores.length;
      }

      const subSubjects = children.map(buildNode);

      if (subSubjects.length > 0) {
        // Hierarchical weighted aggregation
        const totalWeight = subSubjects.reduce(
          (acc, curr) => acc + (curr.coff || 1),
          0,
        );
        const weightedSum = subSubjects.reduce((acc, curr) => {
          return acc + curr.scores.totalScore * (curr.coff || 1);
        }, 0);
        // If the parent also has direct grades, we might need a specific policy (averaging or preferring hierarchy)
        // Here we prefer hierarchical aggregation if children exist
        subjectScore =
          totalWeight > 0 ? weightedSum / totalWeight : subjectScore;
      }

      return {
        name: subject.subjectName,
        subjectId: subject.subjectId,
        weeklyHours: subject.weeklyHours || 0,
        coff: subject.coff || 1,
        teacherName: subject.teacher?.firstName
          ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
          : 'N/A',
        scores: {
          totalScore: parseFloat(subjectScore.toFixed(2)),
          examScores,
        },
        gradeLetter: this.getGradeLetter(subjectScore),
        remarks: this.getRemarks(subjectScore),
        subSubjects: subSubjects.length > 0 ? subSubjects : undefined,
      };
    };

    return roots.map(buildNode);
  }

  private generateVisualizationData(
    subjects: any[],
    attendance: any,
    exams: any[],
  ) {
    // 1. Bar Chart: Subject vs Total Score
    const barChartGrades = subjects.map((s) => ({
      subject: s.name,
      score: s.scores.totalScore,
    }));

    // 2. Line Chart: Exam progress (average of all subjects per exam)
    const lineChartProgress = exams.map((e) => {
      let sum = 0;
      let count = 0;
      subjects.forEach((s) => {
        const examScore = s.scores.examScores.find(
          (es) => es.examType === e.examName,
        );
        if (examScore && examScore.score !== null) {
          sum += examScore.score;
          count++;
        }
      });
      return {
        exam: e.examName,
        average: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
      };
    });

    return {
      barChartGrades,
      lineChartProgress,
      attendanceGraph: [
        { name: 'Present', value: attendance.presentDays },
        { name: 'Absent', value: attendance.absentDays },
        { name: 'Late', value: attendance.lateDays },
      ],
    };
  }

  private getGradeLetter(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    if (score >= 50) return 'E';
    return 'F';
  }

  private getRemarks(score: number): string {
    if (score >= 90) return 'ممتاز (Excellent)';
    if (score >= 80) return 'جيد جدا (Very Good)';
    if (score >= 70) return 'جيد (Good)';
    if (score >= 60) return 'مقبول (Satisfactory)';
    if (score >= 50) return 'ضعيف (Pass)';
    return 'يحتاج تحسين (Needs Improvement)';
  }

  private calculateWeightedTotalAverage(subjects: any[]): number {
    if (subjects.length === 0) return 0;
    const totalWeight = subjects.reduce(
      (acc, curr) => acc + (curr.coff || 1),
      0,
    );
    const weightedSum = subjects.reduce(
      (acc, curr) => acc + curr.scores.totalScore * (curr.coff || 1),
      0,
    );
    return totalWeight > 0
      ? parseFloat((weightedSum / totalWeight).toFixed(2))
      : 0;
  }

  private async getAttendanceSummary(
    tenantId: string,
    studentId: number,
    start: Date,
    end: Date,
  ) {
    const records = await this.prisma.studentAttendance.findMany({
      where: {
        tenantId,
        studentId,
        date: { gte: start, lte: end },
      },
    });

    const totalDays = records.length || 1;
    const presentDays = records.filter((r) => r.status === 'PRESENT').length;

    return {
      totalDays,
      presentDays,
      absentDays: records.filter((r) => r.status === 'ABSENT').length,
      lateDays: records.filter((r) => r.status === 'LATE').length,
      attendancePercentage: Math.round((presentDays / totalDays) * 100),
    };
  }

  private async getBehaviorSummary(tenantId: string, studentId: number) {
    const riskProfile = await this.prisma.studentRiskProfile.findFirst({
      where: { tenantId, studentId },
    });

    return {
      points: riskProfile?.behaviorScore || 100,
      remarks:
        riskProfile?.recommendation || 'أداء سلوكي مستقر (Stable behavior).',
      incidents: 0,
    };
  }

  private async getAIRecommendations(reportSubjects: any[]) {
    const subjectData = reportSubjects.map((s) => ({
      name: s.name,
      history: s.scores.examScores
        .filter((es) => es.score !== null)
        .map((es) => es.score),
      current: s.scores.totalScore,
    }));

    try {
      const aiBaseUrl =
        this.configService.get('AI_SERVICE_URL') || 'http://localhost:8000';
      const response = await firstValueFrom(
        this.httpService.post(`${aiBaseUrl}/report/recommendations`, {
          subjects: subjectData,
        }),
      );
      return response.data.recommendations;
    } catch (error) {
      // Local Fallback logic if AI service is down
      return this.generateLocalRecommendations(subjectData);
    }
  }

  private generateLocalRecommendations(subjects: any[]) {
    const recs = [];
    const lowScores = subjects.filter((s) => s.current < 50);
    const highScores = subjects.filter((s) => s.current > 85);

    if (lowScores.length > 0) {
      recs.push(
        `ضعيف في ${lowScores.map((s) => s.name).join(', ')} - يجب مراجعة الدروس بانتظام.`,
      );
    }
    if (highScores.length > 0) {
      recs.push(
        `ممتاز في ${highScores.map((s) => s.name).join(', ')} - ينصح بالمشاركة في المسابقات العلمية.`,
      );
    }
    if (recs.length === 0) {
      recs.push('أداء مستقر بشكل عام، استمر في العمل الجاد.');
    }
    return recs;
  }
}
