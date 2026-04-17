import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { RegisterTenantDto } from './tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { TenantStatus, Plan, BillingPeriod } from '@prisma/client';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterTenantDto) {
    return this.tenantService.register(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('status') status?: TenantStatus,
    @Query('plan') plan?: Plan,
    @Query('billingPeriod') billingPeriod?: BillingPeriod,
    @Query('search') search?: string,
  ) {
    return this.tenantService.findAll({ status, plan, billingPeriod, search });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    return this.tenantService.updateStatus(id, status);
  }
}
