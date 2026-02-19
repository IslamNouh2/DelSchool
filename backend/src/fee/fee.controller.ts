import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FeeService } from './fee.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { SubscribeStudentDto } from './dto/subscribe-student.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeeController {
    constructor(private readonly feeService: FeeService) { }

    @Post('templates')
    createTemplate(@Body() dto: CreateFeeDto) {
        return this.feeService.createTemplate(dto);
    }

    @Get('templates')
    findAllTemplates() {
        return this.feeService.findAllTemplates();
    }

    @Post('subscribe')
    subscribeStudent(@Body() dto: SubscribeStudentDto) {
        return this.feeService.subscribeStudent(dto);
    }

    @Post('subscribe-all')
    subscribeAll(@Body() body: { templateId: number, dueDate: string }) {
        return this.feeService.subscribeAll(body.templateId, body.dueDate);
    }

    @Post('manual')
    createManualFee(@Body() dto: CreateFeeDto) {
        return this.feeService.createManualFee(dto);
    }

    @Get('student/:id')
    getStudentFees(@Param('id', ParseIntPipe) id: number) {
        return this.feeService.getStudentFees(id);
    }

    @Delete(':id')
    deleteFee(@Param('id', ParseIntPipe) id: number) {
        return this.feeService.deleteFee(id);
    }
}
