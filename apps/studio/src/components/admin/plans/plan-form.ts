import {
  APP_PLAN_LEVELS,
  type AppPlanLevel,
  type CreateStudioPlanDto,
  type StudioPlan,
  type UpdateStudioPlanDto,
} from '@ahmedrioueche/actocore-shared';

export interface PlanFormState {
  planId: string;
  level: AppPlanLevel;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxProjects: number;
  maxTeamSeats: number;
  monthlyTokenQuota: number;
  maxActionsPerProject: number;
  features: string[];
  order: number;
  isActive: boolean;
  isRecommended: boolean;
  yearlyDiscountBadge: string;
}

export function normalizePlanFeatures(features: string[]): string[] {
  return features.map((feature) => feature.trim()).filter(Boolean);
}

function formStateToPricing(form: PlanFormState) {
  if (form.level === 'free') {
    return { USD: { monthly: 0, yearly: 0 } };
  }
  return {
    USD: {
      monthly: form.monthlyPrice,
      yearly: form.yearlyPrice,
    },
  };
}

export function defaultPlanFormState(): PlanFormState {
  return {
    planId: '',
    level: 'starter',
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxProjects: 1,
    maxTeamSeats: 1,
    monthlyTokenQuota: 5_000_000,
    maxActionsPerProject: 30,
    features: [],
    order: 0,
    isActive: true,
    isRecommended: false,
    yearlyDiscountBadge: '',
  };
}

export function planToFormState(plan: StudioPlan): PlanFormState {
  return {
    planId: plan.planId,
    level: plan.level,
    name: plan.name,
    description: plan.description ?? '',
    monthlyPrice: plan.pricing.USD?.monthly ?? 0,
    yearlyPrice: plan.pricing.USD?.yearly ?? 0,
    maxProjects: plan.limits.maxProjects ?? 1,
    maxTeamSeats: plan.limits.maxTeamSeats ?? 1,
    monthlyTokenQuota: plan.limits.monthlyTokenQuota ?? 0,
    maxActionsPerProject: plan.limits.maxActionsPerProject ?? 0,
    features: [...(plan.features ?? [])],
    order: plan.order ?? 0,
    isActive: plan.isActive ?? true,
    isRecommended: plan.isRecommended ?? false,
    yearlyDiscountBadge: plan.yearlyDiscountBadge ?? '',
  };
}

export function formStateToCreateDto(form: PlanFormState): CreateStudioPlanDto {
  return {
    planId: form.planId.trim(),
    level: form.level,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    pricing: formStateToPricing(form),
    limits: {
      maxProjects: form.maxProjects,
      maxTeamSeats: form.maxTeamSeats,
      monthlyTokenQuota: form.monthlyTokenQuota,
      maxActionsPerProject: form.maxActionsPerProject,
    },
    order: form.order,
    isActive: form.isActive,
    isRecommended: form.isRecommended,
    yearlyDiscountBadge: form.yearlyDiscountBadge.trim() || undefined,
    features: normalizePlanFeatures(form.features),
  };
}

export function formStateToUpdateDto(form: PlanFormState): UpdateStudioPlanDto {
  return {
    level: form.level,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    pricing: formStateToPricing(form),
    limits: {
      maxProjects: form.maxProjects,
      maxTeamSeats: form.maxTeamSeats,
      monthlyTokenQuota: form.monthlyTokenQuota,
      maxActionsPerProject: form.maxActionsPerProject,
    },
    features: normalizePlanFeatures(form.features),
    order: form.order,
    isActive: form.isActive,
    isRecommended: form.isRecommended,
    yearlyDiscountBadge: form.yearlyDiscountBadge.trim() || undefined,
  };
}

export const PLAN_LEVEL_OPTIONS = APP_PLAN_LEVELS.map((level) => ({
  value: level,
  label: level,
}));
