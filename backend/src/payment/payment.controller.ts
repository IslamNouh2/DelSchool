import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Prisma } from '@prisma/client';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: Prisma.PaymentUncheckedCreateInput) {
    return this.paymentService.create(createPaymentDto);
  }

  @Post('collect')
  collectPayment(@Body() data: { studentId: number; feeId?: number; amount: number; method: any; date?: string }) {
    return this.paymentService.collectPayment(data);
  }

  @Post('collect-generic')
  collectGenericPayment(@Body() data: { feeId: number; amount: number; method: any; date?: string }) {
    return this.paymentService.collectGenericPayment(data);
  }

  @Get('history')
  getFinanceHistory() {
    return this.paymentService.getFinanceHistory();
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: Prisma.PaymentUncheckedUpdateInput) {
    return this.paymentService.update(+id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(+id);
  }

  @Get('student/:id')
  getStudentPayments(@Param('id') id: string) {
    return this.paymentService.getStudentPayments(+id);
  }
}
