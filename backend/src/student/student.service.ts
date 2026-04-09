import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from 'src/socket/socket.gateway';

import { CreateStudentDto } from './dto/CreateStudentDto';
import { UpdateStudentDto } from './dto/UpdateStudentDto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentService {
  private readonly uploadPath = 'uploads/students';
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {
    void this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  private async savePhotoFile(
    photo: Buffer,
    mimetype: string,
  ): Promise<string> {
    if (!this.allowedMimeTypes.includes(mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    if (photo.length > this.maxFileSize) {
      throw new BadRequestException(
        'File size too large. Maximum 5MB allowed.',
      );
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

  async GetCountStudent(tenantId: string) {
    const total = await this.prisma.student.count({ where: { tenantId } });
    const boys = await this.prisma.student.count({
      where: { gender: 'Male', tenantId },
    });
    const girls = await this.prisma.student.count({
      where: { gender: 'Female', tenantId },
    });
    return { total, boys, girls };
  }

  async CreateStudent(
    tenantId: string,
    dto: CreateStudentDto,
    photo?: Express.Multer.File,
  ) {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      parentId,
      fatherName,
      fatherNumber,
      motherName,
      motherNumber,
      motherJob,
      fatherJob,
      code,
      health,
      dateCreate,
      dateModif,
      lieuOfBirth,
      bloodType,
      etatCivil,
      cid,
      nationality,
      observation,
      numNumerisation,
      dateInscription,
      okBlock,
      localId,
      classId,
      academicYear,
      email,
      phone,
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
          tenantId, // Add tenantId
        },
        select: { parentId: true },
      });
      finalParentId = parent.parentId;
    }
    if (!finalParentId) {
      finalParentId = 1;
    }

    let finalCode = code;
    if (!finalCode) {
      const count = await this.prisma.student.count({ where: { tenantId } });
      finalCode = `STU-${tenantId}-${String(count + 1).padStart(2, '0')}`;
    }

    try {
      const student = await this.prisma.student.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          address,
          parentId: finalParentId,
          code: finalCode,
          health,
          dateCreate: dateCreate ? new Date(dateCreate) : new Date(),
          dateModif: dateModif ? new Date(dateModif) : new Date(),
          lieuOfBirth,
          bloodType,
          etatCivil,
          cid,
          nationality,
          observation,
          numNumerisation,
          dateInscription: new Date(dateInscription),
          okBlock: okBlock === true,
          photoFileName,
          email,
          phone,
          tenantId, // Multi-tenancy
        },
      });

      // Auto-create User for login
      // Use a more secure default password: code + birth year
      const birthYear = new Date(dateOfBirth).getFullYear();
      const defaultPassword = `${finalCode}@${birthYear}`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);

      await this.prisma.user.create({
        data: {
          email: email || `${finalCode}@delschool.com`,
          username: finalCode,
          password: hashedPassword,
          roleId: 3, // STUDENT
          tenantId,
        },
      });

      const targetClassId = Number(classId || localId);
      if (targetClassId) {
        let schoolYear: { id: number } | null = null;
        if (academicYear) {
          schoolYear = await this.prisma.schoolYear.findUnique({
            where: { year: academicYear },
          });
        } else {
          schoolYear = await this.prisma.schoolYear.findFirst({
            where: { isCurrent: true },
          });
          if (!schoolYear) {
            const yearLabel = this.getCurrentAcademicYearLabel();
            schoolYear = await this.prisma.schoolYear.findUnique({
              where: { year: yearLabel },
            });
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
              select: {
                studentClasses: {
                  where: { isCurrent: true, schoolYearId: schoolYear.id },
                },
              },
            },
          },
        });

        if (!targetClass) {
          throw new NotFoundException(
            `Class with ID ${targetClassId} not found`,
          );
        }

        if (targetClass.cloture) {
          throw new BadRequestException(
            `La classe "${targetClass.ClassName}" est clôturée.`,
          );
        }

        if (targetClass._count.studentClasses >= targetClass.NumStudent) {
          // Find alternative classes in the same local
          const alternativeClasses = await this.prisma.classes.findMany({
            where: {
              localId: targetClass.localId,
              cloture: false,
              classId: { not: targetClassId },
            },
            include: {
              _count: {
                select: {
                  studentClasses: {
                    where: { isCurrent: true, schoolYearId: schoolYear.id },
                  },
                },
              },
            },
          });

          const availableAlternatives = alternativeClasses
            .filter((c) => c._count.studentClasses < c.NumStudent)
            .map((c) => c.ClassName);

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
            tenantId, // Add tenantId
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
    if (month < 8) {
      return `${year - 1}-${year}`;
    }
    return `${year}-${year + 1}`;
  }

  async UpdateStudent(
    tenantId: string,
    studentId: number,
    dto: UpdateStudentDto,
    photo?: Express.Multer.File,
  ) {
    const existingStudent = await this.prisma.student.findUnique({
      where: { studentId, tenantId }, // Enforce tenant check
      select: { photoFileName: true, parentId: true },
    });

    if (!existingStudent) {
      throw new NotFoundException('Student not found');
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      parentId,
      fatherName,
      fatherNumber,
      motherName,
      motherNumber,
      motherJob,
      fatherJob,
      code,
      health,
      dateCreate,
      lieuOfBirth,
      bloodType,
      etatCivil,
      cid,
      nationality,
      observation,
      numNumerisation,
      dateInscription,
      okBlock,
      localId,
      classId,
      academicYear,
      email,
      phone,
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
          where: { parentId, tenantId }, // Enforce tenantId
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
            tenantId, // Add tenantId
          },
        });
        finalParentId = parent.parentId;
      }
    }

    const updatedStudent = await this.prisma.student.update({
      where: { studentId },
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        parentId: finalParentId,
        code,
        health,
        dateCreate: dateCreate ? new Date(dateCreate) : undefined,
        dateModif: new Date(),
        lieuOfBirth,
        bloodType,
        etatCivil,
        cid,
        nationality,
        observation,
        numNumerisation,
        dateInscription: dateInscription
          ? new Date(dateInscription)
          : undefined,
        photoFileName,
        okBlock,
        email,
        phone,
      },
    });

    const targetClassId = Number(classId || localId);
    if (targetClassId) {
      let schoolYear: { id: number } | null = null;
      if (academicYear) {
        schoolYear = await this.prisma.schoolYear.findUnique({
          where: { year: academicYear },
        });
      } else {
        schoolYear = await this.prisma.schoolYear.findFirst({
          where: { isCurrent: true },
        });
        if (!schoolYear) {
          const yearLabel = this.getCurrentAcademicYearLabel();
          schoolYear = await this.prisma.schoolYear.findUnique({
            where: { year: yearLabel },
          });
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
            select: {
              studentClasses: {
                where: { isCurrent: true, schoolYearId: schoolYear.id },
              },
            },
          },
        },
      });

      if (!targetClass) {
        throw new NotFoundException(`Class with ID ${targetClassId} not found`);
      }

      const currentAssignment = await this.prisma.studentClass.findUnique({
        where: {
          studentId_schoolYearId: {
            studentId,
            schoolYearId: schoolYear.id,
          },
        },
      });

      if (currentAssignment?.classId !== targetClassId) {
        if (targetClass.cloture) {
          throw new BadRequestException(
            `La classe "${targetClass.ClassName}" est clôturée.`,
          );
        }

        if (targetClass._count.studentClasses >= targetClass.NumStudent) {
          const alternativeClasses = await this.prisma.classes.findMany({
            where: {
              localId: targetClass.localId,
              cloture: false,
              classId: { not: targetClassId },
            },
            include: {
              _count: {
                select: {
                  studentClasses: {
                    where: { isCurrent: true, schoolYearId: schoolYear.id },
                  },
                },
              },
            },
          });

          const availableAlternatives = alternativeClasses
            .filter((c) => c._count.studentClasses < c.NumStudent)
            .map((c) => c.ClassName);

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
          tenantId, // Add tenantId
        },
      });
    }

    this.socketGateway.emitRefresh();
    return updatedStudent;
  }

  async DeleteStudent(tenantId: string, id: number) {
    const student = await this.prisma.student.findUnique({
      where: { studentId: id, tenantId },
      select: { photoFileName: true },
    });

    if (!student) {
      throw new NotFoundException('STUDENT NOT FOUND');
    }

    if (student.photoFileName) {
      await this.deletePhotoFile(student.photoFileName);
    }

    await this.prisma.student.delete({ where: { studentId: id, tenantId } });
    this.socketGateway.emitRefresh();
  }

  async GetStudent(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    classId?: number,
    status?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      tenantId,
    };
    if (classId) {
      where.studentClasses = {
        some: {
          classId: Number(classId),
          isCurrent: true,
        },
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If filtering by status, we must fetch all matching students first, then filter in memory
    if (status && status !== 'ALL') {
      const allStudents = await this.prisma.student.findMany({
        where,
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
                  ClassName: true,
                },
              },
            },
          },
          fees: {
            include: { payments: true },
          },
        },
        orderBy: { lastName: 'asc' },
      });

      const filteredStudents = allStudents
        .map((s) => ({
          ...s,
          financial: this.calculateFinancialSummary(s.fees),
        }))
        .filter((s) => {
          if (status === 'PAID') return s.financial.status === 'PAID';
          if (status === 'UNPAID')
            return (
              s.financial.status === 'UPCOMING' ||
              s.financial.status === 'OVERDUE'
            );
          if (status === 'PARTIAL') return s.financial.status === 'PARTIAL';
          if (status === 'OVERDUE') return s.financial.status === 'OVERDUE';
          return true;
        });

      const total = filteredStudents.length;
      const paginatedStudents = filteredStudents.slice(skip, skip + limit);

      const processedStudents = paginatedStudents.map((s) => ({
        ...s,
        photoUrl: s.photoFileName
          ? `/api/student/photo/${s.photoFileName}`
          : null,
      }));

      return {
        students: processedStudents,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } else {
      // Standard db-side pagination
      const [students, total] = await this.prisma.$transaction([
        this.prisma.student.findMany({
          where,
          skip,
          take: limit,
          orderBy: { lastName: 'asc' },
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
                    ClassName: true,
                  },
                },
              },
            },
            fees: {
              include: { payments: true },
            },
          },
        }),
        this.prisma.student.count({ where }),
      ]);

      const processedStudents = students.map((s) => {
        const financial = this.calculateFinancialSummary(s.fees);
        return {
          ...s,
          photoUrl: s.photoFileName
            ? `/api/student/photo/${s.photoFileName}`
            : null,
          financial,
        };
      });

      return {
        students: processedStudents,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }
  }

  private calculateFinancialSummary(
    fees: {
      title: string;
      amount: Prisma.Decimal | number;
      dueDate: Date | string;
      payments: { amount: Prisma.Decimal | number }[];
    }[],
  ) {
    let totalDue = 0;
    let totalPaid = 0;
    let hasOverdue = false;
    const now = new Date();

    const subscriptions = fees.map((f) => f.title);

    for (const fee of fees) {
      const amount =
        typeof fee.amount === 'number' ? fee.amount : fee.amount.toNumber();

      const paid = fee.payments.reduce(
        (sum: number, p) =>
          sum + (typeof p.amount === 'number' ? p.amount : p.amount.toNumber()),
        0,
      );

      totalDue += amount;
      totalPaid += paid;

      if (paid < amount && new Date(fee.dueDate) < now) {
        hasOverdue = true;
      }
    }

    let status = 'UPCOMING';
    if (fees.length > 0) {
      if (totalPaid >= totalDue) status = 'PAID';
      else if (hasOverdue) status = 'OVERDUE';
      else if (totalPaid > 0) status = 'PARTIAL';
    }

    return {
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid,
      status,
      subscriptions,
    };
  }

  async GetStudentById(tenantId: string, id: number) {
    const student = await this.prisma.student.findUnique({
      where: { studentId: id, tenantId },
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
        email: true,
        phone: true,
        parent: {
          select: {
            parentId: true,
            father: true,
            mother: true,
            fatherNumber: true,
            motherNumber: true,
          },
        },
        studentClasses: {
          where: { isCurrent: true },
          select: {
            classId: true,
            Class: {
              select: {
                ClassName: true,
                localId: true,
              },
            },
          },
        },
        studentAttendance: {
          select: {
            status: true,
            date: true,
          },
        },
        fees: {
          include: { payments: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const currentClass = student.studentClasses?.[0];
    const financial = this.calculateFinancialSummary(student.fees);

    return {
      ...student,
      localId: currentClass?.Class?.localId || null,
      classId: currentClass?.classId || null,
      photoUrl: student.photoFileName
        ? `/api/student/photo/${student.photoFileName}`
        : null,
      fatherName: student.parent?.father || '',
      motherName: student.parent?.mother || '',
      fatherPhone: student.parent?.fatherNumber || '',
      motherPhone: student.parent?.motherNumber || '',
      financial,
    };
  }

  async getLocal(tenantId: string) {
    try {
      return await this.prisma.local.findMany({
        where: { tenantId },
        select: {
          localId: true,
          name: true,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch locales');
    }
  }

  async GetStudentWithName(
    tenantId: string,
    name: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
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
                  ClassName: true,
                },
              },
            },
          },
          fees: {
            include: { payments: true },
          },
        },
      }),
      this.prisma.student.count({
        where: {
          tenantId,
          OR: [
            { lastName: { contains: name, mode: 'insensitive' } },
            { firstName: { contains: name, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    const processedStudents = students.map((student) => ({
      ...student,
      photoUrl: student.photoFileName
        ? `/api/student/photo/${student.photoFileName}`
        : null,
      financial: this.calculateFinancialSummary(student.fees),
    }));

    return {
      students: processedStudents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPhotoFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.uploadPath, fileName);

    try {
      return await fs.readFile(filePath);
    } catch {
      throw new NotFoundException('Photo not found');
    }
  }

  async GetCountParent(tenantId: string) {
    const total = await this.prisma.parent.count({ where: { tenantId } });
    return { total };
  }
}
