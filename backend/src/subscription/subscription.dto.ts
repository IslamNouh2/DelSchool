import { IsEnum, IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { Plan, BillingPeriod, SubscriptionStatus } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @IsEnum(Plan)
  plan: Plan;

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsDateString()
  startDate: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;
}
