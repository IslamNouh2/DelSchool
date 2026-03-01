"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployerService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("src/socket/socket.gateway");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
let EmployerService = class EmployerService {
    prisma;
    socketGateway;
    uploadPath = 'uploads/employers';
    maxFileSize = 5 * 1024 * 1024; // 5MB
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
        this.ensureUploadDirectory();
    }
    async GetCountTeacher(tenantId) {
        const total = await this.prisma.employer.count({
            where: {
                type: { equals: 'teacher', mode: 'insensitive' },
                tenantId
            }
        });
        return { total };
    }
    async GetCountStaff(tenantId) {
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
    async ensureUploadDirectory() {
        try {
            await fs.access(this.uploadPath);
        }
        catch {
            await fs.mkdir(this.uploadPath, { recursive: true });
        }
    }
    async savePhotoFile(photo, mimetype) {
        if (!this.allowedMimeTypes.includes(mimetype)) {
            throw new common_1.BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        }
        if (photo.length > this.maxFileSize) {
            throw new common_1.BadRequestException('File size too large. Maximum 5MB allowed.');
        }
        const fileExtension = mimetype.split('/')[1];
        const fileName = `${(0, uuid_1.v4)()}.${fileExtension}`;
        const filePath = path.join(this.uploadPath, fileName);
        await fs.writeFile(filePath, photo);
        return fileName;
    }
    async deletePhotoFile(fileName) {
        if (!fileName)
            return;
        try {
            const filePath = path.join(this.uploadPath, fileName);
            await fs.unlink(filePath);
            console.log(`✅ Photo file deleted: ${filePath}`);
        }
        catch (error) {
            console.error("❌ Error deleting photo file:", error);
        }
    }
    async deleteEmployer(tenantId, id) {
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
    async CreateEmployer(tenantId, dto, photo) {
        const { firstName, lastName, dateOfBirth, lieuOfBirth, gender, address, fatherName, motherName, health, dateCreate, dateModif, bloodType, etatCivil, cid, nationality, observation, numNumerisation, dateInscription, okBlock, type, phone, weeklyWorkload, salary, salaryBasis, checkInTime, checkOutTime } = dto;
        let photoFileName = null;
        if (photo) {
            photoFileName = await this.savePhotoFile(photo.buffer, photo.mimetype);
        }
        // ✅ 1. Determine type abbreviation
        const typeMap = {
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
        }
        catch (error) {
            if (photoFileName) {
                await this.deletePhotoFile(photoFileName);
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.BadRequestException('Ce code existe déjà. Veuillez en choisir un autre.');
                }
            }
            throw new common_1.InternalServerErrorException('Une erreur interne est survenue.');
        }
    }
    async UpdateEmployer(tenantId, id, dto, photo) {
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
        }
        catch (error) {
            if (photo && photoFileName) {
                await this.deletePhotoFile(photoFileName); // delete if error
            }
            throw error;
        }
    }
    async GetEmployer(tenantId, page = 1, limit = 10, type, search) {
        const skip = (page - 1) * limit;
        const filters = [{ tenantId }]; // Enforce tenant
        if (type)
            filters.push({ type });
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
    async SearchEmployerByName(tenantId, page = 1, limit = 10, name, type) {
        const skip = (page - 1) * limit;
        const nameFilter = name
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
        const typeFilter = type
            ? {
                type: {
                    equals: type,
                },
            }
            : undefined;
        const whereClause = {
            AND: [
                { tenantId }, // Enforce tenant
                nameFilter,
                typeFilter
            ].filter(Boolean),
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
    async GetEmployerById(tenantId, id) {
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
            throw new common_1.NotFoundException('employer not found');
        }
        return {
            ...employer,
            photoUrl: employer.photoFileName ? `/api/employer/photo/${employer.photoFileName}` : null,
        };
    }
    async GetEmployerWithName(tenantId, name, page, limit) {
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
    async getPhotoFile(fileName) {
        const filePath = path.join(this.uploadPath, fileName);
        try {
            return await fs.readFile(filePath);
        }
        catch (error) {
            throw new common_1.NotFoundException('Photo not found');
        }
    }
    async assignClassToTeacher(tenantId, employerId, classId) {
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
    async getTeacherClass(tenantId, employerId) {
        return this.prisma.teaherClass.findFirst({
            where: { employerId, tenantId },
            include: { Class: { include: { local: true } } },
        });
    }
};
exports.EmployerService = EmployerService;
exports.EmployerService = EmployerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof socket_gateway_1.SocketGateway !== "undefined" && socket_gateway_1.SocketGateway) === "function" ? _b : Object])
], EmployerService);
