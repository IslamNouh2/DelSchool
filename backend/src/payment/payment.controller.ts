import { Controller, Post, Body, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('collect')
    collect(@Body() dto: CollectPaymentDto) {
        return this.paymentService.collect(dto);
    }

    @Get('fee/:id')
    getFeePayments(@Param('id', ParseIntPipe) id: number) {
        return this.paymentService.getFeePayments(id);
    }

    @Get('student/:id/history')
    getStudentHistory(@Param('id', ParseIntPipe) id: number) {
        return this.paymentService.getStudentHistory(id);
    }
}
