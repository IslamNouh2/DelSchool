import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';

import { CreateStudentDto } from './dto/CreateStudentDto';
import { UpdateStudentDto } from './dto/UpdateStudentDto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StudentService {
    private readonly uploadPath = 'uploads/students';
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) {
        this.ensureUploadDirectory();
    }

    private async ensureUploadDirectory() {
        try {
            await fs.access(this.uploadPath);
        } catch {
            await fs.mkdir(this.uploadPath, { recursive: true });
        }
    }

    private async savePhotoFile(photo: Buffer, mimetype: string): Promise<string> {
        if (!this.allowedMimeTypes.includes(mimetype)) {
            throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        }

        if (photo.length > this.maxFileSize) {
            throw new BadRequestException('File size too large. Maximum 5MB allowed.');
        }

        const fileExtension = mimetype.split('/')[1];
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = path.join(this.uploadPath, fileName);

        await fs.writeFile(filePath, photo);
        return fileName;
    }

    private async deletePhotoFile(fileName: string) {
        if (!fileName) return;

        try {
            const filePath = path.join(this.uploadPath, fileName);
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting photo file:', error);
        }
    }

    async GetCountStudent() {
        const total = await this.prisma.student.count();
        const boys = await this.prisma.student.count({ where: { gender: 'Male' } });
        const girls = await this.prisma.student.count({ where: { gender: 'Female' } });
        return { total, boys, girls };
    }

    async CreateStudent(dto: CreateStudentDto, photo?: Express.Multer.File) {
        const {
            firstName, lastName, dateOfBirth, gender, address, parentId,
            fatherName, fatherNumber, motherName, motherNumber,
            motherJob, fatherJob, code, health, dateCreate, dateModif,
            lieuOfBirth, bloodType, etatCivil, cid, nationality, observation,
            numNumerisation, dateInscription, okBlock, localId, classId, academicYear,
        } = dto;
        let finalParentId = parentId;
        let photoFileName: string | null = null;
        if (photo) {
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }
        if ((fatherName && fatherNumber) || (motherName && motherNumber)) {
            const parent = await this.prisma.parent.create({
                data: {
                    father: fatherName || '',
                    mother: motherName || '',
                    fatherJob: fatherJob || '',
                    motherJob: motherJob || '',
                    motherNumber: motherNumber || '',
                    fatherNumber: fatherNumber || '',
                },
                select: { parentId: true },
            });
            finalParentId = parent.parentId;
        }
        if (!finalParentId) {
            finalParentId = 1;
        }
        try {
            const student = await this.prisma.student.create({
                data: {
                    firstName, lastName,
                    dateOfBirth: new Date(dateOfBirth),
                    gender, address, parentId: finalParentId,
                    code, health,
                    dateCreate: dateCreate ? new Date(dateCreate) : new Date(),
                    dateModif: dateModif ? new Date(dateModif) : new Date(),
                    lieuOfBirth, bloodType, etatCivil, cid,
                    nationality, observation, numNumerisation,
                    dateInscription: new Date(dateInscription),
                    okBlock: okBlock === true,
                    photoFileName,
                },
            });
            
            const targetClassId = Number(classId || localId);
            if (targetClassId) {
                let schoolYear;
                if (academicYear) {
                    schoolYear = await this.prisma.schoolYear.findUnique({ where: { year: academicYear } });
                } else {
                    schoolYear = await this.prisma.schoolYear.findFirst({ where: { isCurrent: true } });
                    if (!schoolYear) {
                        const yearLabel = this.getCurrentAcademicYearLabel();
                        schoolYear = await this.prisma.schoolYear.findUnique({ where: { year: yearLabel } });
                    }
                }
                
                if (!schoolYear) {
                    const yearLabel = academicYear || this.getCurrentAcademicYearLabel();
                    throw new BadRequestException(`School year ${yearLabel} not found`);
                }

                // Capacity Validation
                const targetClass = await this.prisma.classes.findUnique({
                    where: { classId: targetClassId },
                    include: { 
                        local: true,
                        _count: {
                            select: { studentClasses: { where: { isCurrent: true, schoolYearId: schoolYear.id } } }
                        }
                    }
                });

                if (!targetClass) {
                    throw new NotFoundException(`Class with ID ${targetClassId} not found`);
                }

                if (targetClass.cloture) {
                    throw new BadRequestException(`La classe "${targetClass.ClassName}" est clôturée.`);
                }

                if (targetClass._count.studentClasses >= targetClass.NumStudent) {
                    // Find alternative classes in the same local
                    const alternativeClasses = await this.prisma.classes.findMany({
                        where: {
                            localId: targetClass.localId,
                            cloture: false,
                            classId: { not: targetClassId }
                        },
                        include: {
                            _count: {
                                select: { studentClasses: { where: { isCurrent: true, schoolYearId: schoolYear.id } } }
                            }
                        }
                    });

                    const availableAlternatives = alternativeClasses
                        .filter(c => c._count.studentClasses < c.NumStudent)
                        .map(c => c.ClassName);

                    let errorMessage = `La classe "${targetClass.ClassName}" est complète (${targetClass._count.studentClasses}/${targetClass.NumStudent}).`;
                    if (availableAlternatives.length > 0) {
                        errorMessage += ` Les sections suivantes sont encore disponibles : ${availableAlternatives.join(', ')}.`;
                    } else {
                        errorMessage += ` Aucune autre section n'est disponible pour ce niveau.`;
                    }

                    throw new BadRequestException(errorMessage);
                }

                await this.prisma.studentClass.create({
                    data: {
                        studentId: student.studentId,
                        classId: targetClassId,
                        schoolYearId: schoolYear.id,
                        isCurrent: true,
                    },
                });
            }

            this.socketGateway.emitRefresh();
            return {
                student,
                studentId: student.studentId,
                localId: Number(localId),
                photoUrl: photoFileName ? `/api/student/photo/${photoFileName}` : null,
            };
        } catch (error) {
            if (photoFileName) {
                await this.deletePhotoFile(photoFileName);
            }
            throw error;
        }
    }

    private getCurrentAcademicYearLabel(): string {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const year = now.getFullYear();
        // If current month is before September (0-7), the academic year started in the previous calendar year
        if (month < 8) {
            return `${year - 1}-${year}`;
        }
        return `${year}-${year + 1}`;
    }

    async UpdateStudent(studentId: number, dto: UpdateStudentDto, photo?: Express.Multer.File) {
        const existingStudent = await this.prisma.student.findUnique({
            where: { studentId },
            select: { photoFileName: true, parentId: true }
        });

        if (!existingStudent) {
            throw new NotFoundException('Student not found');
        }

        const {
            firstName, lastName, dateOfBirth, gender, address, parentId,
            fatherName, fatherNumber, motherName, motherNumber,
            motherJob, fatherJob, code, health, dateCreate, dateModif,
            lieuOfBirth, bloodType, etatCivil, cid, nationality,
            observation, numNumerisation, dateInscription, okBlock,
            localId, classId, academicYear
        } = dto;

        let finalParentId = parentId;
        let photoFileName = existingStudent.photoFileName;

        if (photo) {
            if (existingStudent.photoFileName) {
                await this.deletePhotoFile(existingStudent.photoFileName);
            }
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }

        if ((fatherName && fatherNumber) || (motherName && motherNumber)) {
            if (parentId && parentId !== 1) {
                await this.prisma.parent.update({
                    where: { parentId },
                    data: {
                        father: fatherName || undefined,
                        mother: motherName || undefined,
                        fatherJob: fatherJob || undefined,
                        motherJob: motherJob || undefined,
                        fatherNumber: fatherNumber || undefined,
                        motherNumber: motherNumber || undefined,
                    },
                });
                finalParentId = parentId;
            } else {
                const parent = await this.prisma.parent.create({
                    data: {
                        father: fatherName || '',
                        mother: motherName || '',
                        fatherJob: fatherJob || '',
                        motherJob: motherJob || '',
                        fatherNumber: fatherNumber || '',
                        motherNumber: motherNumber || '',
                    },
                });
                finalParentId = parent.parentId;
            }
        }

        const updatedStudent = await this.prisma.student.update({
            where: { studentId },
            data: {
                firstName, lastName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender, address, parentId: finalParentId,
                code, health,
                dateCreate: dateCreate ? new Date(dateCreate) : undefined,
                dateModif: new Date(),
                lieuOfBirth, bloodType, etatCivil, cid,
                nationality, observation, numNumerisation,
                dateInscription: dateInscription ? new Date(dateInscription) : undefined,
                photoFileName, okBlock,
            },
        });

        const targetClassId = Number(classId || localId);
        if (targetClassId) {
            let schoolYear;
            if (academicYear) {
                schoolYear = await this.prisma.schoolYear.findUnique({ where: { year: academicYear } });
            } else {
                schoolYear = await this.prisma.schoolYear.findFirst({ where: { isCurrent: true } });
                if (!schoolYear) {
                    const yearLabel = this.getCurrentAcademicYearLabel();
                    schoolYear = await this.prisma.schoolYear.findUnique({ where: { year: yearLabel } });
                }
            }

            if (!schoolYear) {
                const yearLabel = academicYear || this.getCurrentAcademicYearLabel();
                throw new BadRequestException(`School year ${yearLabel} not found`);
            }

            // Capacity Validation
            const targetClass = await this.prisma.classes.findUnique({
                where: { classId: targetClassId },
                include: { 
                    local: true,
                    _count: {
                        select: { studentClasses: { where: { isCurrent: true, schoolYearId: schoolYear.id } } }
                    }
                }
            });

            if (!targetClass) {
                throw new NotFoundException(`Class with ID ${targetClassId} not found`);
            }

            // Check if student is already in this class (don't block update if staying in same full class)
            const currentAssignment = await this.prisma.studentClass.findUnique({
                where: {
                    studentId_schoolYearId: {
                        studentId,
                        schoolYearId: schoolYear.id,
                    },
                }
            });

            if (currentAssignment?.classId !== targetClassId) {
                if (targetClass.cloture) {
                    throw new BadRequestException(`La classe "${targetClass.ClassName}" est clôturée.`);
                }

                if (targetClass._count.studentClasses >= targetClass.NumStudent) {
                    const alternativeClasses = await this.prisma.classes.findMany({
                        where: {
                            localId: targetClass.localId,
                            cloture: false,
                            classId: { not: targetClassId }
                        },
                        include: {
                            _count: {
                                select: { studentClasses: { where: { isCurrent: true, schoolYearId: schoolYear.id } } }
                            }
                        }
                    });

                    const availableAlternatives = alternativeClasses
                        .filter(c => c._count.studentClasses < c.NumStudent)
                        .map(c => c.ClassName);

                    let errorMessage = `La classe "${targetClass.ClassName}" est complète (${targetClass._count.studentClasses}/${targetClass.NumStudent}).`;
                    if (availableAlternatives.length > 0) {
                        errorMessage += ` Les sections suivantes sont encore disponibles : ${availableAlternatives.join(', ')}.`;
                    } else {
                        errorMessage += ` Aucune autre section n'est disponible pour ce niveau.`;
                    }

                    throw new BadRequestException(errorMessage);
                }
            }

            await this.prisma.studentClass.upsert({
                where: {
                    studentId_schoolYearId: {
                        studentId,
                        schoolYearId: schoolYear.id,
                    },
                },
                update: {
                    classId: targetClassId,
                    isCurrent: true,
                },
                create: {
                    studentId,
                    classId: targetClassId,
                    schoolYearId: schoolYear.id,
                    isCurrent: true,
                },
            });
        }

        this.socketGateway.emitRefresh();
        return updatedStudent;
    }

    async DeleteStudent(id: number) {
        const student = await this.prisma.student.findUnique({
            where: { studentId: id },
            select: { photoFileName: true }
        });

        if (!student) {
            throw new NotFoundException('STUDENT NOT FOUND');
        }

        if (student.photoFileName) {
            await this.deletePhotoFile(student.photoFileName);
        }

        await this.prisma.student.delete({ where: { studentId: id } });
        this.socketGateway.emitRefresh();
    }

    async GetStudent(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [students, total] = await this.prisma.$transaction([
            this.prisma.student.findMany({
                skip,
                take: limit,
                select: {
                    studentId: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    gender: true,
                    photoFileName: true,
                    studentClasses: {
                        where: { isCurrent: true },
                        include: {
                            Class: {
                                select: {
                                    ClassName: true
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.student.count(),
        ]);

        const studentsWithPhotoUrl = students.map((student) => ({
            ...student,
            photoUrl: student.photoFileName ? `/api/student/photo/${student.photoFileName}` : null,
        }));

        return {
            students: studentsWithPhotoUrl,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async GetStudentById(id: number) {
        const student = await this.prisma.student.findUnique({
            where: { studentId: id },
            select: {
                studentId: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true,
                address: true,
                code: true,
                health: true,
                lieuOfBirth: true,
                bloodType: true,
                etatCivil: true,
                cid: true,
                nationality: true,
                observation: true,
                numNumerisation: true,
                dateInscription: true,
                dateCreate: true,
                dateModif: true,
                okBlock: true,
                photoFileName: true,
                parent: {
                    select: {
                        parentId: true,
                        father: true,
                        mother: true,
                        fatherNumber: true,
                        motherNumber: true,
                    }
                },
                studentClasses: {
                    where: { isCurrent: true },
                    select: {
                        classId: true,
                        Class: {
                            select: {
                                ClassName: true,
                                localId: true
                            }
                        }
                    }
                },
                studentAttendance: {
                    select: {
                        status: true,
                        date: true
                    }
                }
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        const currentClass = student.studentClasses?.[0];

        return {
            ...student,
            localId: currentClass?.Class?.localId || null,
            classId: currentClass?.classId || null,
            photoUrl: student.photoFileName ? `/api/student/photo/${student.photoFileName}` : null,
            fatherName: student.parent?.father || '',
            motherName: student.parent?.mother || '',
            fatherPhone: student.parent?.fatherNumber || '',
            motherPhone: student.parent?.motherNumber || '',
        };
    }

    async getLocal() {
        try {
            return await this.prisma.local.findMany({
                select: {
                    localId: true,
                    name: true,
                }
            });
        } catch (error) {
            throw new InternalServerErrorException('Failed to fetch locales');
        }
    }

    async GetStudentWithName(name: string, page: number, limit: number) {
        const skip = (page - 1) * limit;

        const [students, total] = await this.prisma.$transaction([
            this.prisma.student.findMany({
                where: {
                    OR: [
                        { lastName: { contains: name, mode: 'insensitive' } },
                        { firstName: { contains: name, mode: 'insensitive' } },
                    ],
                },
                skip,
                take: limit,
                select: {
                    studentId: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    gender: true,
                    photoFileName: true,
                    studentClasses: {
                        where: { isCurrent: true },
                        include: {
                            Class: {
                                select: {
                                    ClassName: true
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.student.count({
                where: {
                    OR: [
                        { lastName: { contains: name, mode: 'insensitive' } },
                        { firstName: { contains: name, mode: 'insensitive' } },
                    ],
                },
            }),
        ]);

        const studentsWithPhotoUrl = students.map((student) => ({
            ...student,
            photoUrl: student.photoFileName ? `/api/student/photo/${student.photoFileName}` : null,
        }));

        return {
            students: studentsWithPhotoUrl,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getPhotoFile(fileName: string): Promise<Buffer> {
        const filePath = path.join(this.uploadPath, fileName);

        try {
            return await fs.readFile(filePath);
        } catch (error) {
            throw new NotFoundException('Photo not found');
        }
    }
}
