import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class ParameterService {
    constructor(
        private prisma: PrismaService,
        private readonly socketGateway: SocketGateway
    ) { }

    async create(createParameterDto: CreateParameterDto) {
        const result = await this.prisma.parameter.create({
            data: createParameterDto,
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async findAll() {
        return this.prisma.parameter.findMany();
    }

    async findOne(paramName: string) {
        return this.prisma.parameter.findUnique({
            where: { paramName },
        });
    }

    async update(paramName: string, updateParameterDto: UpdateParameterDto) {
        const result = await this.prisma.parameter.update({
            where: { paramName },
            data: updateParameterDto,
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    async remove(paramName: string) {
        const result = await this.prisma.parameter.delete({
            where: { paramName },
        });
        this.socketGateway.emitRefresh();
        return result;
    }

    // --- Business Rule Helpers ---

    async getLateThreshold(): Promise<{ hours: number; minutes: number }> {
        const param = await this.findOne('Attendance_Late_Threshold');
        const val = param?.paramValue || '08:10';
        const [h, m] = val.split(':').map(Number);
        return { hours: isNaN(h) ? 8 : h, minutes: isNaN(m) ? 10 : m };
    }

    async getMonthlyDays(): Promise<number> {
        const param = await this.findOne('Payroll_Monthly_Days');
        const val = parseInt(param?.paramValue || '30');
        return isNaN(val) ? 30 : val;
    }

    async getLatePenaltyRatio(): Promise<number> {
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
}