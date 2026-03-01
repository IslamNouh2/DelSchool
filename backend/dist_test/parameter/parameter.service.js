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
exports.ParameterService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("prisma/prisma.service");
const socket_gateway_1 = require("../socket/socket.gateway");
let ParameterService = class ParameterService {
    prisma;
    socketGateway;
    constructor(prisma, socketGateway) {
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }
    async create(createParameterDto) {
        const result = await this.prisma.parameter.create({
            data: createParameterDto,
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    async findAll() {
        return this.prisma.parameter.findMany();
    }
    async findOne(paramName) {
        return this.prisma.parameter.findUnique({
            where: { paramName },
        });
    }
    async update(paramName, updateParameterDto) {
        const result = await this.prisma.parameter.update({
            where: { paramName },
            data: updateParameterDto,
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    async remove(paramName) {
        const result = await this.prisma.parameter.delete({
            where: { paramName },
        });
        this.socketGateway.emitRefresh();
        return result;
    }
    // --- Business Rule Helpers ---
    async getLateThreshold() {
        const param = await this.findOne('Attendance_Late_Threshold');
        const val = param?.paramValue || '08:10';
        const [h, m] = val.split(':').map(Number);
        return { hours: isNaN(h) ? 8 : h, minutes: isNaN(m) ? 10 : m };
    }
    async getMonthlyDays() {
        const param = await this.findOne('Payroll_Monthly_Days');
        const val = parseInt(param?.paramValue || '30');
        return isNaN(val) ? 30 : val;
    }
    async getLatePenaltyRatio() {
        const param = await this.findOne('Payroll_Late_Penalty_Ratio');
        const val = parseInt(param?.paramValue || '3');
        return isNaN(val) ? 3 : val;
    }
    async getOkSubSubjectStatus() {
        const param = await this.prisma.parameter.findUnique({
            where: { paramName: 'Ok_Sub_subject' },
        });
        return param?.okActive ?? false;
    }
};
exports.ParameterService = ParameterService;
exports.ParameterService = ParameterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, socket_gateway_1.SocketGateway])
], ParameterService);
