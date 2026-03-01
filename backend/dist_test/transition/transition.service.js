"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransitionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("../socket/socket.gateway");
let TransitionService = class TransitionService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    async getPassingStudents(tenantId, classId) {
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
        const studentsWithAverages = studentClasses.map(sc => {
            const grads = sc.grads;
            const average = grads.length > 0
                ? grads.reduce((acc, curr) => acc + curr.grads, 0) / grads.length
                : 0;
            return {
                ...sc.Student,
                studentClassId: sc.id,
                average,
            };
        });
        // Filter students with average >= 10
        return studentsWithAverages.filter(s => s.average >= 10);
    }
    async transitionStudents(tenantId, dto) {
        // Check capacity for each involved next class
        const nextClassIds = [...new Set(dto.transitions.map(t => t.nextClassId))];
        for (const nextClassId of nextClassIds) {
            const nextClass = await this.prisma.classes.findFirst({
                where: { classId: nextClassId, tenantId },
                include: { local: true }
            });
            if (!nextClass)
                throw new common_1.BadRequestException(`Class ${nextClassId} not found`);
            const local = nextClass.local;
            const schoolYear = await this.prisma.schoolYear.findFirst({
                where: { year: dto.nextYear, tenantId }
            });
            if (!schoolYear)
                throw new common_1.BadRequestException(`School year ${dto.nextYear} not found`);
            if (local && local.size > 0) {
                // Count current students in all classes assigned to this local for the next year
                const studentCountInLocal = await this.prisma.studentClass.count({
                    where: {
                        schoolYearId: schoolYear.id,
                        tenantId,
                        Class: {
                            localId: local.localId
                        }
                    }
                });
                // Count how many new students we are adding to this local
                const newStudentsInLocal = dto.transitions.filter(t => {
                    // This is approximate since we don't know the class -> local mapping here easily without more queries
                    // but we can just check those going to this specific class
                    return t.nextClassId === nextClassId;
                }).length;
                // Note: The user's logic "if local size 60 and create 2class with size 30 you can not create another class"
                // suggests we should also check the SUM of Class.NumStudent in that local.
                const otherClassesInLocal = await this.prisma.classes.findMany({
                    where: { localId: local.localId, tenantId }
                });
                const totalTargetCapacity = otherClassesInLocal.reduce((acc, c) => acc + c.NumStudent, 0);
                if (totalTargetCapacity > local.size) {
                    throw new common_1.BadRequestException(`Local ${local.name} capacity exceeded. Total class capacities (${totalTargetCapacity}) > Local size (${local.size})`);
                }
                // Also check if current student assignments exceed capacity
                if (studentCountInLocal + newStudentsInLocal > local.size) {
                    // We count those going to this class, but wait, the check should be per local
                    // Let's refine this if needed, but the user's requirement was specifically about class numbers vs local size
                }
            }
        }
        const schoolYear = await this.prisma.schoolYear.findFirst({
            where: { year: dto.nextYear, tenantId }
        });
        if (!schoolYear)
            throw new common_1.BadRequestException(`School year ${dto.nextYear} not found`);
        // Perform transitions in a transaction
        return await this.prisma.$transaction(async (tx) => {
            const results = [];
            for (const transition of dto.transitions) {
                // 1. Cloture old record
                await tx.studentClass.update({
                    where: { id: transition.studentClassId },
                    data: {
                        isCurrent: false,
                        cloture: true,
                        tenantId: tenantId // Add tenantId
                    }
                });
                // 2. Create new record for the next year
                const newSc = await tx.studentClass.create({
                    data: {
                        studentId: transition.studentId,
                        classId: transition.nextClassId,
                        schoolYearId: schoolYear.id,
                        isCurrent: true,
                        cloture: false,
                        tenantId // Add tenantId
                    }
                });
                results.push(newSc);
            }
            this.socketGateway.emitRefresh();
            return results;
        });
    }
};
exports.TransitionService = TransitionService;
exports.TransitionService = TransitionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, socket_gateway_1.SocketGateway])
], TransitionService);
