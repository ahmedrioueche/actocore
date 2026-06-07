import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import {
  APP_PLAN_LEVELS,
  APP_SUBSCRIPTION_BILLING_CYCLES,
} from '../types/billing';

export class CreateStudioPlanDto {
  @IsString()
  @MinLength(1)
  planId!: string;

  @IsIn(APP_PLAN_LEVELS)
  level!: (typeof APP_PLAN_LEVELS)[number];

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  pricing!: Record<string, { monthly?: number; yearly?: number }>;

  @IsOptional()
  @IsString()
  paypalProductId?: string;

  @IsOptional()
  @IsObject()
  paypalPlanIds?: { monthly?: string; yearly?: string };

  @IsOptional()
  @IsNumber()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsObject()
  limits!: {
    maxProjects?: number;
    maxTeamSeats?: number;
    monthlyChatQuota?: number;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

export class UpdateStudioPlanDto {
  @IsOptional()
  @IsIn(APP_PLAN_LEVELS)
  level?: (typeof APP_PLAN_LEVELS)[number];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  pricing?: Record<string, { monthly?: number; yearly?: number }>;

  @IsOptional()
  @IsString()
  paypalProductId?: string;

  @IsOptional()
  @IsObject()
  paypalPlanIds?: { monthly?: string; yearly?: string };

  @IsOptional()
  @IsNumber()
  trialDays?: number;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  limits?: {
    maxProjects?: number;
    maxTeamSeats?: number;
    monthlyChatQuota?: number;
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

export class StartFreeTrialDto {
  @IsString()
  @MinLength(1)
  planId!: string;

  @IsOptional()
  @IsIn(APP_SUBSCRIPTION_BILLING_CYCLES)
  billingCycle?: (typeof APP_SUBSCRIPTION_BILLING_CYCLES)[number];
}

export class CreateSubscriptionCheckoutDto {
  @IsString()
  @MinLength(1)
  planId!: string;

  @IsOptional()
  @IsIn(APP_SUBSCRIPTION_BILLING_CYCLES)
  billingCycle?: (typeof APP_SUBSCRIPTION_BILLING_CYCLES)[number];
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ScheduleDowngradeDto {
  @IsString()
  @MinLength(1)
  planId!: string;

  @IsOptional()
  @IsIn(APP_SUBSCRIPTION_BILLING_CYCLES)
  billingCycle?: (typeof APP_SUBSCRIPTION_BILLING_CYCLES)[number];
}

export class UpgradeSubscriptionDto {
  @IsString()
  @MinLength(1)
  planId!: string;

  @IsOptional()
  @IsIn(APP_SUBSCRIPTION_BILLING_CYCLES)
  billingCycle?: (typeof APP_SUBSCRIPTION_BILLING_CYCLES)[number];
}
