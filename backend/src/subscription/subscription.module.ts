import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionExpiryCron } from './subscription-expiry.cron';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionGuard, SubscriptionExpiryCron],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
