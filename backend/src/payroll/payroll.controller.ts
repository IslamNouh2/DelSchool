import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(createPayrollDto);
  }

  @Post('generate')
  generate(@Body() generatePayrollDto: GeneratePayrollDto) {
    return this.payrollService.generatePayroll(generatePayrollDto);
  }

  @Get()
  findAll(@Query('start') start?: string, @Query('end') end?: string) {
    return this.payrollService.findAll(start, end);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollService.update(+id, updatePayrollDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payrollService.remove(+id);
  }

  @Post('pay/:id')
  pay(@Param('id') id: string, @Body() body: { paymentMethod: string, compteId?: number, expenseAccountId?: number }) {
    return this.payrollService.payPayroll(+id, body.paymentMethod, body.compteId, body.expenseAccountId);
  }
}
