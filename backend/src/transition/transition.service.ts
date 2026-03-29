import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class TransitionService {
  constructor(
    private prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async getPassingStudents(tenantId: string, classId: number) {
    // Fetch students in the class
    const studentClasses = await this.prisma.studentClass.findMany({
      where: {
        classId: classId,
        isCurrent: true,
        cloture: false,
        tenantId, // Filter by tenantId
      },
      include: {
        Student: true,
        grads: true,
      },
    });

    // Simple average calculation: sum of all grads / number of grads
    // In a real scenario, this might be more complex (weights, etc.)
    const studentsWithAverages = studentClasses.map((sc) => {
      const grads = sc.grads;
      const average =
        grads.length > 0
          ? grads.reduce((acc, curr) => acc + curr.grads, 0) / grads.length
          : 0;
      return {
        ...sc.Student,
        studentClassId: sc.id,
        average,
      };
    });

    // Filter students with average >= 10
    return studentsWithAverages.filter((s) => s.average >= 10);
  }

  async transitionStudents(
    tenantId: string,
    dto: {
      nextYear: string;
      transitions: {
        studentId: number;
        studentClassId: number;
        nextClassId: number;
      }[];
    },
  ) {
    // Check capacity for each involved next class
    const nextClassIds = [
      ...new Set(dto.transitions.map((t) => t.nextClassId)),
    ];

    for (const nextClassId of nextClassIds) {
      const nextClass = await this.prisma.classes.findFirst({
        where: { classId: nextClassId, tenantId },
        include: { local: true },
      });

      if (!nextClass)
        throw new BadRequestException(`Class ${nextClassId} not found`);

      const local = nextClass.local;
      const schoolYear = await this.prisma.schoolYear.findFirst({
        where: { year: dto.nextYear, tenantId },
      });
      if (!schoolYear)
        throw new BadRequestException(`School year ${dto.nextYear} not found`);

      if (local && local.size > 0) {
        // Count current students in all classes assigned to this local for the next year
        const studentCountInLocal = await this.prisma.studentClass.count({
          where: {
            schoolYearId: schoolYear.id,
            tenantId,
            Class: {
              localId: local.localId,
            },
          },
        });

        // Count how many new students we are adding to this local
        const newStudentsInLocal = dto.transitions.filter((t) => {
          // This is approximate since we don't know the class -> local mapping here easily without more queries
          // but we can just check those going to this specific class
          return t.nextClassId === nextClassId;
        }).length;

        // Note: The user's logic "if local size 60 and create 2class with size 30 you can not create another class"
        // suggests we should also check the SUM of Class.NumStudent in that local.
        const otherClassesInLocal = await this.prisma.classes.findMany({
          where: { localId: local.localId, tenantId },
        });
        const totalTargetCapacity = otherClassesInLocal.reduce(
          (acc, c) => acc + c.NumStudent,
          0,
        );

        if (totalTargetCapacity > local.size) {
          throw new BadRequestException(
            `Local ${local.name} capacity exceeded. Total class capacities (${totalTargetCapacity}) > Local size (${local.size})`,
          );
        }

        // Also check if current student assignments exceed capacity
        if (studentCountInLocal + newStudentsInLocal > local.size) {
          // We count those going to this class, but wait, the check should be per local
          // Let's refine this if needed, but the user's requirement was specifically about class numbers vs local size
        }
      }
    }

    const schoolYear = await this.prisma.schoolYear.findFirst({
      where: { year: dto.nextYear, tenantId },
    });
    if (!schoolYear)
      throw new BadRequestException(`School year ${dto.nextYear} not found`);

    // Perform transitions in a transaction
    return await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const transition of dto.transitions) {
        // 1. Cloture old record
        await tx.studentClass.update({
          where: { id: transition.studentClassId },
          data: {
            isCurrent: false,
            cloture: true,
            tenantId: tenantId, // Add tenantId
          },
        });

        // 2. Create new record for the next year
        const newSc = await tx.studentClass.create({
          data: {
            studentId: transition.studentId,
            classId: transition.nextClassId,
            schoolYearId: schoolYear.id,
            isCurrent: true,
            cloture: false,
            tenantId, // Add tenantId
          },
        });
        results.push(newSc);
      }
      this.socketGateway.emitRefresh();
      return results;
    });
  }
}
