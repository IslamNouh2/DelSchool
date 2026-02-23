import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a single payroll record manually' })
  create(@Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(createPayrollDto);
  }

  @Post('generate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Generate payrolls for all or specific employers for a period' })
  generate(@Body() generatePayrollDto: GeneratePayrollDto) {
    return this.payrollService.generatePayroll(generatePayrollDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payroll records with optional period filter' })
  findAll(@Query('start') start?: string, @Query('end') end?: string) {
    return this.payrollService.findAll(start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single payroll record' })
  findOne(@Param('id') id: string) {
    return this.payrollService.findOne(+id);
  }

  @Get('employer/:id')
  @ApiOperation({ summary: 'Get payroll records for a specific employer' })
  findByEmployer(@Param('id') id: string) {
    return this.payrollService.findByEmployerId(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a payroll record' })
  update(@Param('id') id: string, @Body() updatePayrollDto: UpdatePayrollDto) {
    return this.payrollService.update(+id, updatePayrollDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a payroll record' })
  remove(@Param('id') id: string) {
    return this.payrollService.remove(+id);
  }

  @Post('submit/:id')
  @ApiOperation({ summary: 'Submit a payroll for approval' })
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.submitPayroll(+id, user.id);
  }

  @Post('approve/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve a payroll and create accounting expense' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.approvePayroll(+id, user.id);
  }

  @Post('pay/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mark payroll as paid and create treasury payment/journal entry' })
  pay(@Param('id') id: string, @Body() body: { paymentMethod: string, compteId?: number, expenseAccountId?: number }) {
    return this.payrollService.payPayroll(+id, body.paymentMethod, body.compteId, body.expenseAccountId);
  }
}
