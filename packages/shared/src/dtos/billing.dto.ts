import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { STUDIO_PLAN_FEATURE_IDS } from '../constants/studio-plan-features';
import type { StudioPlanLocaleText } from '../constants/studio-plan-features';
import {
  APP_PLAN_LEVELS,
  APP_SUBSCRIPTION_BILLING_CYCLES,
} from '../types/billing';

export class StudioPlanLocaleTextDto implements StudioPlanLocaleText {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fr?: string;
}

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
  @ValidateNested()
  @Type(() => StudioPlanLocaleTextDto)
  description?: StudioPlanLocaleTextDto;

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
    monthlyTokenQuota?: number;
    maxActionsPerProject?: number;
  };

  @IsOptional()
  @IsArray()
  @IsIn(STUDIO_PLAN_FEATURE_IDS, { each: true })
  features?: (typeof STUDIO_PLAN_FEATURE_IDS)[number][];

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => StudioPlanLocaleTextDto)
  yearlyDiscountBadge?: StudioPlanLocaleTextDto;
}

export class UpdateStudioPlanDto {
  @IsOptional()
  @IsIn(APP_PLAN_LEVELS)
  level?: (typeof APP_PLAN_LEVELS)[number];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StudioPlanLocaleTextDto)
  description?: StudioPlanLocaleTextDto;

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
    monthlyTokenQuota?: number;
    maxActionsPerProject?: number;
  };

  @IsOptional()
  @IsArray()
  @IsIn(STUDIO_PLAN_FEATURE_IDS, { each: true })
  features?: (typeof STUDIO_PLAN_FEATURE_IDS)[number][];

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => StudioPlanLocaleTextDto)
  yearlyDiscountBadge?: StudioPlanLocaleTextDto;
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

export class UpgradeSubscriptionDto {
  @IsString()
  @MinLength(1)
  planId!: string;

  @IsOptional()
  @IsIn(APP_SUBSCRIPTION_BILLING_CYCLES)
  billingCycle?: (typeof APP_SUBSCRIPTION_BILLING_CYCLES)[number];
}
