import { Controller, Get } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('stats')
  getStats() {
    return this.financeService.getStats();
  }

  @Get('chart')
  getChartData() {
    return this.financeService.getChartData();
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
