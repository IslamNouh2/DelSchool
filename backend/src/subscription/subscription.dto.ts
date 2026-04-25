import {
  IsString,
  IsEnum,
  IsBoolean,
  IsISO8601,
  IsOptional,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Plan, BillingPeriod, SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsEnum(Plan)
  plan: Plan;

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsISO8601()
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
