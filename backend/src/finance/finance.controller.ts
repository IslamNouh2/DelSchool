import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.financeService.getStats(req.tenantId);
  }

  @Get('chart')
  getChartData(@Req() req: any, @Query('period') period?: string) {
    return this.financeService.getChartData(req.tenantId, period);
  }

  @Get('recent')
  getRecentTransactions(@Req() req: any) {
    return this.financeService.getRecentTransactions(req.tenantId);
  }

  @Get('categories')
  getExpenseCategories(@Req() req: any) {
    return this.financeService.getExpenseCategories(req.tenantId);
  }

  @Get('student-payments')
  getRecentStudentPayments(@Req() req: any) {
    return this.financeService.getRecentStudentPayments(req.tenantId);
  }

  @Get('expenses')
  getRecentExpenses(@Req() req: any) {
    return this.financeService.getRecentExpenses(req.tenantId);
  }
}
