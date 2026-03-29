import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a single payroll record manually' })
  create(@Req() req: any, @Body() createPayrollDto: CreatePayrollDto) {
    return this.payrollService.create(req.tenantId, createPayrollDto);
  }

  @Post('generate')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Generate payrolls for all or specific employers for a period',
  })
  generate(@Req() req: any, @Body() generatePayrollDto: GeneratePayrollDto) {
    return this.payrollService.generatePayroll(
      req.tenantId,
      generatePayrollDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payroll records with optional period filter',
  })
  findAll(
    @Req() req: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.payrollService.findAll(req.tenantId, start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single payroll record' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.findOne(req.tenantId, +id);
  }

  @Get('employer/:id')
  @ApiOperation({ summary: 'Get payroll records for a specific employer' })
  findByEmployer(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.findByEmployerId(req.tenantId, +id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a payroll record' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
  ) {
    return this.payrollService.update(req.tenantId, +id, updatePayrollDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a payroll record' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.payrollService.remove(req.tenantId, +id);
  }

  @Post('submit/:id')
  @ApiOperation({ summary: 'Submit a payroll for approval' })
  submit(@Req() req: any, @Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.submitPayroll(req.tenantId, +id, user.id);
  }

  @Post('approve/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve a payroll and create accounting expense' })
  approve(@Req() req: any, @Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollService.approvePayroll(req.tenantId, +id, user.id);
  }

  @Post('pay/:id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Mark payroll as paid and create treasury payment/journal entry',
  })
  pay(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      paymentMethod: string;
      compteId?: number;
      expenseAccountId?: number;
    },
  ) {
    return this.payrollService.payPayroll(
      req.tenantId,
      +id,
      body.paymentMethod,
      body.compteId,
      body.expenseAccountId,
    );
  }
}
