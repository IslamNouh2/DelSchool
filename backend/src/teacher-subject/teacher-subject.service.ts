import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateteacherSubjectDto } from './dto/CreateTeacherSubject.Dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class TeacherSubjectService {
    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }


    async bulkInsert(dto: CreateteacherSubjectDto) {
        const { employerId, subjectIds } = dto;

        // 1) Prepare the records
        const records = subjectIds.map((subjectId) => ({
            employerId,
            subjectId,
            isCurrent: false,
        }));

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // 2) Validate employer is a teacher
                const employer = await tx.employer.findUnique({
                    where: { employerId: employerId },
                    select: { type: true },  // or whatever field denotes the role/type
                });

                if (!employer) {
                    throw new BadRequestException(`Employer with id ${employerId} does not exist.`);
                }
                if (employer.type !== 'teacher') {
                    throw new BadRequestException(`Employer id ${employerId} is not a teacher.`);
                }

                // 3) Do your bulk insert
                const insertResult = await tx.teacherSubject.createMany({
                    data: records,
                    skipDuplicates: true,
                });

                return insertResult;
            });

            this.socketGateway.emitRefresh();
            return {
                message: 'Subjects assigned successfully.',
                count: result.count,
            };
        } catch (error) {
            // Prisma will auto-rollback on any thrown error in the tx callback
            console.error('Transaction failed, rolled back:', error);
            throw error;
        }
    }



    async getSubjectsByTeacher(employerId: number) {
        return this.prisma.teacherSubject.findMany({
            where: { employerId: Number(employerId) },
            include: {
                subject: true,
            },
        });
    }

    // teacher-subject.service.ts
    async getTeacherBySubject(subjectId: number) {
        return this.prisma.teacherSubject.findMany({
            where: { subjectId: Number(subjectId)},
            include: { Employer: true },
        });
    }

    async removeSubjectFromTeacher(employerId: number, subjectId: number) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const record = await tx.teacherSubject.findFirst({
                    where: {
                        employerId,
                        subjectId,
                    },
                });

                if (!record) {
                    throw new NotFoundException('Subject not assigned to this Teacher.');
                }

                await tx.teacherSubject.delete({
                    where: {
                        id: record.id,
                    },
                });

                return { message: 'Subject removed from Teacher successfully.' };
            });

            this.socketGateway.emitRefresh();
            return result;
        } catch (error) {
            // Optionally handle error logging or rethrow
            console.error('Transaction failed and rolled back:', error);
            throw error;
        }
    }


}
