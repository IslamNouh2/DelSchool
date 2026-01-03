import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
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

    async getOkSubSubjectStatus() {
        const param = await this.prisma.parameter.findUnique({
            where: { paramName: 'Ok_Sub_subject' },
        });
        return param?.okActive ?? false;
    }
}