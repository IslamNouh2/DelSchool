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
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const sync_payload_dto_1 = require("./dto/sync-payload.dto");
let SyncService = class SyncService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    idFieldMap = {
        student: 'studentId',
        parent: 'parentId',
        local: 'localId',
        classes: 'classId',
        subject: 'subjectId',
        employer: 'employerId',
        compte: 'id',
        fee: 'id',
        expense: 'id',
        payment: 'id',
        studentattendance: 'id',
        employerattendance: 'id',
        timetable: 'id',
        exam: 'id',
        grads: 'id',
        journal: 'id',
        journalentry: 'id',
        journalline: 'id',
        event: 'id',
        schoolyear: 'id',
        timeslot: 'id',
    };
    async processBulkSync(tenantId, userId, dto) {
        const results = [];
        for (const op of dto.operations) {
            try {
                const result = await this.executeOperation(tenantId, userId, op);
                results.push({ operationId: op.operationId, status: 'success', data: result });
            }
            catch (error) {
                results.push({
                    operationId: op.operationId,
                    status: 'error',
                    message: error.message,
                    conflict: error instanceof common_1.ConflictException,
                    serverData: error instanceof common_1.ConflictException ? error.getResponse() : undefined
                });
            }
        }
        return results;
    }
    async executeOperation(tenantId, userId, op) {
        const entityKey = op.entity.toLowerCase();
        const model = this.prisma[entityKey];
        if (!model) {
            throw new common_1.BadRequestException(`Entity ${op.entity} not found`);
        }
        const idField = this.idFieldMap[entityKey] || 'id';
        // Check for idempotency
        const existing = await model.findUnique({
            where: { operationId: op.operationId },
        });
        if (existing) {
            return existing; // Already processed
        }
        switch (op.type) {
            case sync_payload_dto_1.SyncOperationType.CREATE:
                return model.create({
                    data: {
                        ...op.data,
                        tenantId,
                        operationId: op.operationId,
                        version: 1,
                    },
                });
            case sync_payload_dto_1.SyncOperationType.UPDATE:
                const recordId = op.data[idField];
                if (!recordId)
                    throw new common_1.BadRequestException(`Missing ID field ${idField} in data`);
                const current = await model.findUnique({
                    where: { [idField]: recordId },
                });
                if (!current)
                    throw new common_1.BadRequestException(`Record ${recordId} not found for entity ${op.entity}`);
                if (current.tenantId !== tenantId)
                    throw new common_1.UnauthorizedException('Tenant mismatch');
                // Conflict detection (Server-authoritative)
                if (op.version && current.version !== op.version) {
                    throw new common_1.ConflictException({
                        message: 'Version mismatch',
                        serverVersion: current.version,
                        serverData: current,
                    });
                }
                const { [idField]: _, ...updateData } = op.data;
                return model.update({
                    where: { [idField]: recordId },
                    data: {
                        ...updateData,
                        version: current.version + 1,
                        operationId: op.operationId,
                    },
                });
            case sync_payload_dto_1.SyncOperationType.DELETE:
                const deleteId = op.data[idField];
                return model.delete({
                    where: { [idField]: deleteId, tenantId },
                });
            default:
                throw new common_1.BadRequestException(`Invalid operation type: ${op.type}`);
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], SyncService);
