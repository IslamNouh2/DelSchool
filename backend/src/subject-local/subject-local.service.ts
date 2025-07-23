import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLocalSubjectBulkDto } from './dto/create-local-subject-bulk.dto';

@Injectable()
export class SubjectLocalService {

    constructor(private prisma: PrismaService) { };

    async bulkInsert(dto: CreateLocalSubjectBulkDto) {
        const { localId, subjectIds } = dto;

        const records = subjectIds.map((subjectId) => ({
            localId,
            subjectId,
            cloture: false,
            dateCreate: new Date(),
        }));

        return await this.prisma.subject_local.createMany({
            data: records,
            skipDuplicates: true,
        });
    }


    async getSubjectsByLocal(localId: number) {
        return this.prisma.subject_local.findMany({
            where: { localId: Number(localId) },
            include: {
                subject: true, // includes subject details (name, etc.)
            },
        });
    }

    async removeSubjectFromLocal(localId: number, subjectId: number) {
        const record = await this.prisma.subject_local.findFirst({
            where: {
                localId,
                subjectId,
            },
        });

        if (!record) {
            throw new NotFoundException('Subject not assigned to this local.');
        }

        await this.prisma.subject_local.delete({
            where: {
                subjectLocalId: record.subjectLocalId,
            },
        });

        return { message: 'Subject removed from local successfully.' };
    }
}

// async removeIfNotCloture(localId: number, subjectId: number) {
//     // Find the subject_local record
//     const record = await this.prisma.subject_local.findUnique({
//         where: {
//             subjectLocalId: {

//             }
//         },
//     });

//     if (!record) {
//         throw new NotFoundException('Subject-Local relation not found');
//     }

//     if (record.cloture) {
//         throw new BadRequestException('Cannot delete a clôturé subject-local relation');
//     }

//     await this.prisma.subject_local.delete({
//         where: {
//             subjectLocalId: record.subjectLocalId,
//         },
//     });

//     return { message: 'Subject removed successfully' };
// }


