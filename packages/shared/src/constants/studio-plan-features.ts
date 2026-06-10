export const STUDIO_PLAN_FEATURE_IDS = [
  'knowledge_and_actions',
  'sdk_embed',
  'everything_in_free',
  'everything_in_starter',
  'everything_in_pro',
  'email_support',
  'priority_support',
  'dedicated_support',
] as const;

export type StudioPlanFeatureId = (typeof STUDIO_PLAN_FEATURE_IDS)[number];

export const STUDIO_PLAN_TIER_INHERITANCE_PREFIX = 'everything_in_';

export interface StudioPlanLocaleText {
  en?: string;
  fr?: string;
}
