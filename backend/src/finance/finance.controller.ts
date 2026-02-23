import { Controller, Get, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('stats')
  getStats() {
    return this.financeService.getStats();
  }

  @Get('chart')
  getChartData(@Query('period') period?: string) {
    return this.financeService.getChartData(period);
  }

  @Get('recent')
  getRecentTransactions() {
    return this.financeService.getRecentTransactions();
  }

  @Get('categories')
  getExpenseCategories() {
    return this.financeService.getExpenseCategories();
  }

  @Get('student-payments')
  getRecentStudentPayments() {
    return this.financeService.getRecentStudentPayments();
  }

  @Get('expenses')
  getRecentExpenses() {
    return this.financeService.getRecentExpenses();
  }
}
