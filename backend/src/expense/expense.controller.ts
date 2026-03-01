import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  create(@Req() req: any, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expenseService.create(req.tenantId, createExpenseDto);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.expenseService.findAll(req.tenantId, pageNumber, limitNumber, search);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.expenseService.findOne(req.tenantId, +id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.update(req.tenantId, +id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.expenseService.remove(req.tenantId, +id);
  }

  @Post(':id/pay')
  pay(@Req() req: any, @Param('id') id: string, @Body() body: { treasuryId: number; method: string }) {
    return this.expenseService.pay(req.tenantId, +id, body);
  }
}
