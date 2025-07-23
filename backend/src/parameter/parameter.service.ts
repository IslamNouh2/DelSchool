import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';

@Injectable()
export class ParameterService {
    constructor(private prisma: PrismaService) { }

    async create(createParameterDto: CreateParameterDto) {
        return this.prisma.parameter.create({
            data: createParameterDto,
        });
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
        return this.prisma.parameter.update({
            where: { paramName },
            data: updateParameterDto,
        });
    }

    async remove(paramName: string) {
        return this.prisma.parameter.delete({
            where: { paramName },
        });
    }

    async getOkSubSubjectStatus() {
        const param = await this.prisma.parameter.findUnique({
            where: { paramName: 'Ok_Sub_subject' },
        });
        return param?.okActive ?? false;
    }
}