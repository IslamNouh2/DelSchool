import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/type/authenticated-user.type';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('stats')
  getStats() {
    return this.subscriptionService.getStats();
  }

  @Get('block-status')
  check(@Request() req: { user: AuthenticatedUser }) {
    const tenantId = req.user.tenantId;
    console.log(
      `[SubscriptionController] block-status called for tenant: ${tenantId}`,
    );
    if (!tenantId) {
      console.error('[SubscriptionController] NO TENANT ID IN REQUEST');
      // If no tenantId, we can't be blocked by subscription (likely a global user)
      return { blocked: false };
    }
    return this.subscriptionService.check(tenantId);
  }

  @Get(':tenantId')
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.subscriptionService.findByTenant(tenantId);
  }

  @Post(':tenantId')
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    // Ensure tenantId in DTO matches URL
    dto.tenantId = tenantId;
    return this.subscriptionService.create(dto);
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
