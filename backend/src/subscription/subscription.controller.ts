import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ======== ADMIN ROUTES (SaaS Owner) ========

  @Get('admin/stats')
  @UseGuards(SuperAdminGuard)
  adminGetStats() {
    return this.subscriptionService.adminGetStats();
  }

  @Get('admin/tenants')
  @UseGuards(SuperAdminGuard)
  adminGetAll() {
    return this.subscriptionService.adminGetAllSubscriptions();
  }

  @Patch('admin/tenant/:tenantId')
  @UseGuards(SuperAdminGuard)
  adminForceUpdate(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.adminForceUpdate(tenantId, dto);
  }

  // ======== TENANT ROUTES ========

  @Get(':tenantId')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.subscriptionService.findByTenant(tenantId);
  }

  @Post(':tenantId')
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.create(tenantId, dto);
  }

  @Patch(':tenantId')
  update(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(tenantId, dto);
  }

  @Post(':tenantId/renew')
  renewNow(@Param('tenantId') tenantId: string) {
    return this.subscriptionService.renewNow(tenantId);
  }

  @Post(':tenantId/suspend')
  suspend(@Param('tenantId') tenantId: string) {
    return this.subscriptionService.suspend(tenantId);
  }
}
