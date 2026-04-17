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

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('stats')
  getStats() {
    return this.subscriptionService.getStats();
  }

  @Get('check')
  check(@Request() req: { user: { tenantId: string } }) {
    return this.subscriptionService.check(req.user.tenantId);
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
