import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
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

    constructor(private prisma: PrismaService) {
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
            fatherName, fatherNumber, matherName, matherNumber,
            matherJob, fatherJob, code, health, dateCreate, dateModif,
            lieuOfBirth, bloodType, etatCivil, cid, nationality, observation,
            numNumerisation, dateInscription, okBlock, localId, academicYear,
        } = dto;
        let finalParentId = parentId;
        let photoFileName: string | null = null;
        if (photo) {
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }
        if ((fatherName && fatherNumber) || (matherName && matherNumber)) {
            const parent = await this.prisma.parent.create({
                data: {
                    father: fatherName || '',
                    mother: matherName || '',
                    fatherJob: fatherJob || '',
                    motherJob: matherJob || '',
                    motherNumber: matherNumber || '',
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
            console.log('CreateStudent DTO:', dto);
            await this.prisma.studentClass.create({
                data: {
                    studentId: student.studentId,
                    classId: Number(localId),
                    academicYear: academicYear || this.getCurrentAcademicYear(),
                    isCurrent: true,
                },
            });
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

    private getCurrentAcademicYear(): string {
        const now = new Date();
        const year = now.getFullYear();
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
            fatherName, fatherNumber, matherName, matherNumber,
            matherJob, fatherJob, code, health, dateCreate, dateModif,
            lieuOfBirth, bloodType, etatCivil, cid, nationality,
            observation, numNumerisation, dateInscription, okBlock,
        } = dto;

        let finalParentId = parentId;
        let photoFileName = existingStudent.photoFileName;

        if (photo) {
            if (existingStudent.photoFileName) {
                await this.deletePhotoFile(existingStudent.photoFileName);
            }
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }

        if ((fatherName && fatherNumber) || (matherName && matherNumber)) {
            if (parentId && parentId !== 1) {
                await this.prisma.parent.update({
                    where: { parentId },
                    data: {
                        father: fatherName || undefined,
                        mother: matherName || undefined,
                        fatherJob: fatherJob || undefined,
                        motherJob: matherJob || undefined,
                        fatherNumber: fatherNumber || undefined,
                        motherNumber: matherNumber || undefined,
                    },
                });
                finalParentId = parentId;
            } else {
                const parent = await this.prisma.parent.create({
                    data: {
                        father: fatherName || '',
                        mother: matherName || '',
                        fatherJob: fatherJob || '',
                        motherJob: matherJob || '',
                        fatherNumber: fatherNumber || '',
                        motherNumber: matherNumber || '',
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
                    photoFileName: true,
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
                parentId: true,
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        return {
            ...student,
            photoUrl: student.photoFileName ? `/api/student/photo/${student.photoFileName}` : null,
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
                    photoFileName: true,
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
