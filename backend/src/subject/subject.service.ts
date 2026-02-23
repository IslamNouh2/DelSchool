import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';


@Injectable()
export class SubjectService {
    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) { }



    async create(createSubjectDto: CreateSubjectDto) {
        let { subjectName, totalGrads } = createSubjectDto;

        // Step 0: Get the parameter that controls sub-subjects
        const getParam = await this.prisma.parameter.findFirst({
            where: { paramName: 'Ok_Sub_subject' },
            select: { okActive: true },
        });

        // Force parentId = -1 if sub-subjects are not allowed
        let parentId: number;
        if (getParam?.okActive === false) {
            parentId = -1;
        } else {
            parentId = createSubjectDto.parentId ?? -1;
        }

        // Step 1: Get BG, BD, and calculate level of the parent
        const parent = await this.prisma.subject.findUnique({
            where: { subjectId: parentId },
            select: { BG: true, BD: true, level: true },
        });

        if (!parent && parentId !== -1) {
            throw new Error('Parent subject not found');
        }

        const { BG: parentBG, BD: parentBD, level: parentLevel } = parent || {
            BG: 0,
            BD: 0,
            level: -1,
        };

        // Calculate the new subject's level
        const level = parentId === -1 ? 0 : (parentLevel ?? 0) + 1;

        // Step 2: Use transaction to update & insert
        return this.prisma.$transaction(async (tx) => {
            // Update existing subjects' BG/BD values
            await tx.subject.updateMany({
                where: { BG: { gt: parentBD } },
                data: { BG: { increment: 2 } },
            });

            await tx.subject.updateMany({
                where: { BD: { gte: parentBD } },
                data: { BD: { increment: 2 } },
            });

            // Create the new subject with calculated level
            const newSubject = await tx.subject.create({
                data: {
                    subjectName,
                    totalGrads,
                    parentId,
                    BG: parentBD,
                    BD: parentBD + 1,
                    level, // Add the calculated level
                    dateCreate: new Date(),
                    dateModif: new Date(),
                    okBlock: false,
                    translations: createSubjectDto.translations ? {
                        create: Object.entries(createSubjectDto.translations).map(([locale, name]) => ({
                            locale,
                            name,
                        })),
                    } : undefined,
                },
                include: { translations: true }
            });

            this.socketGateway.emitRefresh();
            return newSubject;
        });
    }


    async findSubSubjects() {
        return this.prisma.subject.findMany({
            where: {
                parentId: -1 // Only get subjects that have a parent
            },
            select: {
                subjectId: true,
                subjectName: true,
                totalGrads: true,
                BG: true,
                BD: true
            }
        });
    }


    async findAll(
        page: number = 1,
        limit: number = 10,
        orderByField: string = 'dateCreate',
        name?: string,
        status?: string, // "active" | "blocked"
    ) {
        const skip = (page - 1) * limit;

        // Build dynamic "where" filter
        const where: any = {
            subjectId: { gt: -1 },
        };

        // 🔍 Filter by name (case-insensitive)
        if (name) {
            where.subjectName = {
                contains: name,
                mode: 'insensitive',
            };
        }

        // 🟢 Filter by status
        if (status) {
            if (status === 'active') where.okBlock = false;
            else if (status === 'blocked') where.okBlock = true;
        }

        const [subjects, total] = await this.prisma.$transaction([
            this.prisma.subject.findMany({
                where,
                orderBy: { [orderByField]: 'desc' },
                skip,
                take: limit,
                include: {
                    parent: {
                        select: {
                            subjectId: true,
                            subjectName: true,
                        }
                    },
                    translations: true
                },
            }),
            this.prisma.subject.count({ where }),
        ]);

        // Transform the data to include flattened parent information
        const subjectsWithParentInfo = subjects.map(subject => ({
            ...subject,
            parentId: subject.parent?.subjectId || null,
            parentName: subject.parent?.subjectName || null,
            // Remove the nested parent object if you want a flat structure
            // parent: undefined
        }));

        return {
            subjects: subjectsWithParentInfo,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        return this.prisma.subject.findUnique({
            where: { subjectId: id },
            include: { parent: { select: { subjectId: true, subjectName: true } } },
        });
    }


    async update(subjectId: number, updateDto: UpdateSubjectDto) {
        const { subjectName, totalGrads, parentId: newParentIdInput, okBlock } = updateDto;

        // Get Ok_sub_subject param
        const param = await this.prisma.parameter.findUnique({
            where: { paramName: 'Ok_Sub_subject' },
            select: { okActive: true },
        });

        // Determine effective parentId
        const parentId = param?.okActive === false ? -1 : newParentIdInput;

        // Fetch current node and new parent node
        const current = await this.prisma.subject.findUnique({
            where: { subjectId },
            select: { BG: true, BD: true, parentId: true },
        });

        if (!current) throw new Error('Subject not found');

        const parent = await this.prisma.subject.findUnique({
            where: { subjectId: parentId },
            select: { BD: true },
        });

        if (!parent && parentId !== -1) throw new Error('New parent not found');

        // 🧠 If parent changed, handle nested set movement
        if (current.parentId !== parentId) {
            const width = current.BD - current.BG + 1;

            await this.prisma.$transaction(async (tx) => {
                // Step 1: Temporarily remove the current node and its subtree
                await tx.subject.updateMany({
                    where: {
                        BG: { gte: current.BG },
                        BD: { lte: current.BD },
                    },
                    data: {
                        BG: { increment: -current.BG },
                        BD: { increment: -current.BG },
                    },
                });

                await tx.subject.updateMany({
                    where: { BG: { gt: current.BD } },
                    data: { BG: { decrement: width } },
                });

                await tx.subject.updateMany({
                    where: { BD: { gt: current.BD } },
                    data: { BD: { decrement: width } },
                });

                // Step 2: Make room under new parent
                const newPos = parentId === -1 ? 1 : parent!.BD;

                await tx.subject.updateMany({
                    where: { BG: { gte: newPos } },
                    data: { BG: { increment: width } },
                });

                await tx.subject.updateMany({
                    where: { BD: { gte: newPos } },
                    data: { BD: { increment: width } },
                });

                // Step 3: Move subtree to new location
                await tx.subject.updateMany({
                    where: { BG: { lt: 0 } },
                    data: {
                        BG: { increment: newPos },
                        BD: { increment: newPos },
                    },
                });

                // ✅ Update parentId, name, points, and okBlock
                await tx.subject.update({
                    where: { subjectId },
                    data: {
                        subjectName,
                        totalGrads,
                        parentId,
                        okBlock, // <-- Added
                    },
                });
            });
        } else {
            // ✅ Parent not changed, just update name, totalGrads, and okBlock
            await this.prisma.subject.update({
                where: { subjectId },
                data: {
                    subjectName,
                    totalGrads,
                    okBlock, // <-- Added
                    translations: updateDto.translations ? {
                        deleteMany: {},
                        create: Object.entries(updateDto.translations).map(([locale, name]) => ({
                            locale,
                            name,
                        })),
                    } : undefined,
                },
            });
        }

        this.socketGateway.emitRefresh();
        return { message: 'Subject updated successfully' };
    }



    async remove(id: number) {
        const subject = await this.prisma.subject.findUnique({
            where: { subjectId: id }
        });

        if (!subject) {
            throw new Error("subject Not Exist");
        };

        await this.prisma.subject.delete({ where: { subjectId: id } });
        this.socketGateway.emitRefresh();
    }

    async StubjectCount() {
        const count = await this.prisma.subject.count();
        return count
    }


}
