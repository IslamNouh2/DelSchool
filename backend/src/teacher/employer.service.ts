import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaService } from "../prisma/prisma.service";
import { SocketGateway } from "src/socket/socket.gateway";
import { v4 as uuidv4 } from 'uuid';
import { CreateEmployerDto } from "./dto/CreateEmployer.dto";
import { UpdateEmployerDto } from "./dto/UpdateEmployer.dto";
import { Prisma } from "@prisma/client";

@Injectable()

export class EmployerService {
    private readonly uploadPath = 'uploads/employers';
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    constructor(
        private prisma: PrismaService,
        private socketGateway: SocketGateway
    ) {
        this.ensureUploadDirectory();
    }

    async GetCountTeacher(tenantId: string) {
        const total = await this.prisma.employer.count({
            where: { 
                type: { equals: 'teacher', mode: 'insensitive' },
                tenantId
            }
        });
        return { total };
    }

    async GetCountStaff(tenantId: string) {
        const total = await this.prisma.employer.count({
            where: {
                type: {
                    in: ['employer', 'admin'],
                    mode: 'insensitive'
                },
                tenantId
            }
        });
        return { total };
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

    private async deletePhotoFile(fileName: string | null) {
        if (!fileName) return;

        try {
            const filePath = path.join(this.uploadPath, fileName);
            await fs.unlink(filePath);
            console.log(`✅ Photo file deleted: ${filePath}`);
        } catch (error) {
            console.error("❌ Error deleting photo file:", error);
        }
    }

    async deleteEmployer(tenantId: string, id: number): Promise<void> {
        const employer = await this.prisma.employer.findFirst({ 
            where: { employerId: id, tenantId } 
        });
        if (!employer) {
            throw new Error("Employer not found");
        }

        // Delete from database
        await this.prisma.employer.delete({ 
            where: { employerId: id } // employerId is unique globally but we checked tenant above
        });
        this.socketGateway.emitRefresh();

        // Delete associated photo
        await this.deletePhotoFile(employer.photoFileName);
    }


    async CreateEmployer(tenantId: string, dto: CreateEmployerDto, photo?: Express.Multer.File) {
        const {
            firstName, lastName, dateOfBirth, lieuOfBirth, gender, address,
            fatherName,  motherName, health, dateCreate, dateModif,
            bloodType, etatCivil, cid, nationality, observation, numNumerisation,
            dateInscription, okBlock, type, phone, weeklyWorkload, salary,
            salaryBasis, checkInTime, checkOutTime
        } = dto;

        let photoFileName: string | null = null;
        if (photo) {
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }

        // ✅ 1. Determine type abbreviation
        const typeMap: Record<string, string> = {
            teacher: "TCH",
            admin: "ADM",
            employer: "EMP",
        };

        const typeCode = typeMap[type.toLowerCase()] || "UNK";

        // ✅ 2. Find the highest existing code with that prefix
        const prefix = `EMP-${typeCode}`;
        const latest = await this.prisma.employer.findFirst({
            where: {
                tenantId,
                code: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                code: "desc",
            },
        });

        // ✅ 3. Determine next code number
        let nextNumber = 1;
        if (latest?.code) {
            const parts = latest.code.split("-");
            const lastNumber = parseInt(parts[2], 10);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        const newCode = `${prefix}-${String(nextNumber).padStart(3, "0")}`;

        try {
            const employer = await this.prisma.employer.create({
                data: {
                    firstName,
                    lastName,
                    dateOfBirth: new Date(dateOfBirth),
                    gender,
                    address,
                    salary: Number(dto.salary || 0),
                    code: newCode, // ✅ Use generated code here
                    health,
                    fatherName,
                    motherName,
                    dateCreate: dateCreate ? new Date(dateCreate) : new Date(),
                    dateModif: dateModif ? new Date(dateModif) : new Date(),
                    lieuOfBirth,
                    bloodType,
                    phone,
                    etatCivil,
                    cid,
                    nationality,
                    observation,
                    numNumerisation,
                    dateInscription: dateInscription ? new Date(dateInscription) : new Date(),
                    okBlock: okBlock === false,
                    photoFileName,
                    type,
                    weeklyWorkload: weeklyWorkload || 20,
                    salaryBasis: salaryBasis || "DAILY",
                    checkInTime: checkInTime || "08:00",
                    checkOutTime: checkOutTime || "16:00",
                    tenantId, // Enforce tenant
                },
            });

            this.socketGateway.emitRefresh();
            return {
                employer,
                employerId: employer.employerId,
                photoUrl: photoFileName ? `/api/employer/photo/${photoFileName}` : null,
            };
        } catch (error) {
            if (photoFileName) {
                await this.deletePhotoFile(photoFileName);
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new BadRequestException('Ce code existe déjà. Veuillez en choisir un autre.');
                }
            }

            throw new InternalServerErrorException('Une erreur interne est survenue.');
        }
    }



    async UpdateEmployer(tenantId: string, id: number, dto: UpdateEmployerDto, photo?: Express.Multer.File) {
        const existing = await this.prisma.employer.findFirst({
            where: { employerId: id, tenantId },
        });

        if (!existing) {
            throw new Error('Employer not found');
        }

        let photoFileName = existing.photoFileName;

        if (photo) {
            if (photoFileName) {
                await this.deletePhotoFile(photoFileName); // delete old
            }
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }

        try {
            const updated = await this.prisma.employer.update({
                where: { employerId: id },
                data: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                    gender: dto.gender,
                    address: dto.address,
                    fatherName: dto.fatherName,
                    motherName: dto.motherName,
                    code: dto.code,
                    health: dto.health,
                    dateCreate: dto.dateCreate ? new Date(dto.dateCreate) : undefined,
                    dateModif: dto.dateModif ? new Date(dto.dateModif) : new Date(),
                    lieuOfBirth: dto.lieuOfBirth,
                    bloodType: dto.bloodType,
                    phone: dto.phone,
                    etatCivil: dto.etatCivil,
                    cid: dto.cid,
                    nationality: dto.nationality,
                    observation: dto.observation,
                    numNumerisation: dto.numNumerisation,
                    dateInscription: dto.dateInscription ? new Date(dto.dateInscription) : undefined,
                    okBlock: dto.okBlock ?? false,
                    type: dto.type,
                    weeklyWorkload: dto.weeklyWorkload !== undefined ? dto.weeklyWorkload : undefined,
                    salary: dto.salary !== undefined ? dto.salary : undefined,
                    salaryBasis: dto.salaryBasis,
                    checkInTime: dto.checkInTime,
                    checkOutTime: dto.checkOutTime,
                    photoFileName: photoFileName,
                },
            });
            console.log('DTO received on backend:', dto.okBlock, typeof dto.okBlock);
            this.socketGateway.emitRefresh();
            return {
                employer: updated,
                photoUrl: photoFileName ? `/api/employer/photo/${photoFileName}` : null,

            };
        } catch (error) {
            if (photo && photoFileName) {
                await this.deletePhotoFile(photoFileName); // delete if error
            }
            throw error;
        }
    }

    async GetEmployer(tenantId: string, page: number = 1, limit: number = 10, type?: string, search?: string) {
        const skip = (page - 1) * limit;
        
        const filters: any[] = [{ tenantId }]; // Enforce tenant
        if (type) filters.push({ type });
        if (search) {
            filters.push({
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { code: { contains: search, mode: 'insensitive' } },
                ]
            });
        }

        const whereClause = filters.length > 0 ? { AND: filters } : {};

        const [employers, total] = await this.prisma.$transaction([
            this.prisma.employer.findMany({
                skip,
                take: limit,
                where: whereClause,
                select: {
                    employerId: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    dateInscription: true,
                    dateOfBirth: true,
                    type: true,
                    cid: true,
                    photoFileName: true,
                    okBlock: true,
                },
                orderBy: { lastName: 'asc' }
            }),
            this.prisma.employer.count({ where: whereClause }),
        ]);

        const employersWithPhotoUrl = employers.map((employer) => ({
            ...employer,
            photoUrl: employer.photoFileName ? `/api/employer/photo/${employer.photoFileName}` : null,
        }));

        return {
            employers: employersWithPhotoUrl,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async SearchEmployerByName(
        tenantId: string,
        page: number = 1,
        limit: number = 10,
        name?: string,
        type?: string
    ) {
        const skip = (page - 1) * limit;

        const nameFilter: Prisma.EmployerWhereInput | undefined = name
            ? {
                OR: [
                    {
                        firstName: {
                            contains: name,
                            mode: "insensitive",
                        },
                    },
                    {
                        lastName: {
                            contains: name,
                            mode: "insensitive",
                        },
                    },
                ],
            }
            : undefined;

        const typeFilter: Prisma.EmployerWhereInput | undefined = type
            ? {
                type: {
                    equals: type,
                },
            }
            : undefined;

        const whereClause: Prisma.EmployerWhereInput = {
            AND: [
                { tenantId }, // Enforce tenant
                nameFilter, 
                typeFilter
            ].filter(Boolean) as Prisma.EmployerWhereInput[],
        };

        const [employers, total] = await this.prisma.$transaction([
            this.prisma.employer.findMany({
                skip,
                take: limit,
                where: whereClause,
                select: {
                    employerId: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    dateInscription: true,
                    dateOfBirth: true,
                    type: true,
                    cid: true,
                    photoFileName: true,
                    okBlock: true,
                },
            }),
            this.prisma.employer.count({ where: whereClause }),
        ]);

        const employersWithPhotoUrl = employers.map((employer) => ({
            ...employer,
            photoUrl: employer.photoFileName
                ? `/api/employer/photo/${employer.photoFileName}`
                : null,
        }));

        return {
            employers: employersWithPhotoUrl,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }


    async GetEmployerById(tenantId: string, id: number) {
        const employer = await this.prisma.employer.findFirst({
            where: { employerId: id, tenantId },
            select: {
                employerId: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                lieuOfBirth: true,
                gender: true,
                address: true,
                fatherName: true,
                motherName: true,
                code: true,
                health: true,
                dateCreate: true,
                dateModif: true,
                bloodType: true,
                etatCivil: true,
                cid: true,
                nationality: true,
                observation: true,
                numNumerisation: true,
                dateInscription: true,
                okBlock: true,
                type: true,
                weeklyWorkload: true,
                salary: true,
                salaryBasis: true,
                checkInTime: true,
                checkOutTime: true,
                photoFileName: true,
                compte: {
                    select: {
                        id: true,
                        name: true,
                    },
                    where: { tenantId }
                }
            }
        });

        if (!employer) {
            throw new NotFoundException('employer not found');
        }

        return {
            ...employer,
            photoUrl: employer.photoFileName ? `/api/employer/photo/${employer.photoFileName}` : null,
        };
    }

    async GetEmployerWithName(tenantId: string, name: string, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const [employers, total] = await this.prisma.$transaction([
            this.prisma.employer.findMany({
                where: {
                    tenantId,
                    OR: [
                        { lastName: { contains: name, mode: 'insensitive' } },
                        { firstName: { contains: name, mode: 'insensitive' } },
                    ],
                },
                skip,
                take: limit,
                select: {
                    employerId: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    photoFileName: true,
                    type: true,
                    gender: true,
                    okBlock: true,
                },
            }),
            this.prisma.employer.count({
                where: {
                    tenantId,
                    OR: [
                        { lastName: { contains: name, mode: 'insensitive' } },
                        { firstName: { contains: name, mode: 'insensitive' } },
                    ],
                },
            }),
        ]);

        const employersWithPhotoUrl = employers.map((employer) => ({
            ...employer,
            photoUrl: employer.photoFileName ? `/api/employer/photo/${employer.photoFileName}` : null,
        }));

        return {
            employers: employersWithPhotoUrl,
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

    async assignClassToTeacher(tenantId: string, employerId: number, classId: number) {
        // Check if assignment exists
        const existing = await this.prisma.teaherClass.findFirst({
            where: { employerId, tenantId },
        });

        if (existing) {
            return this.prisma.teaherClass.update({
                where: { employerId },
                data: { classId, isCurrent: true },
            });
        }

        return this.prisma.teaherClass.create({
            data: {
                employerId,
                classId,
                isCurrent: true,
                tenantId, // Enforce tenant
            },
        });
    }

    async getTeacherClass(tenantId: string, employerId: number) {
        return this.prisma.teaherClass.findFirst({
            where: { employerId, tenantId },
            include: { Class: { include: { local: true } } },
        });
    }
}