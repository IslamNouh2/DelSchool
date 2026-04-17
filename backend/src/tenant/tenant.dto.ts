import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  IsLowercase,
  Matches,
} from 'class-validator';
import { Plan, BillingPeriod } from '@prisma/client';

export class RegisterTenantDto {
  @IsString()
  name: string;

  @IsString()
  @IsLowercase()
  @Matches(/^[a-z0-9-]+$/, { message: 'Domain must be a lowercase slug' })
  domain: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;

  @IsEnum(Plan)
  plan: Plan;

  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @IsString()
  wilaya: string;
}
