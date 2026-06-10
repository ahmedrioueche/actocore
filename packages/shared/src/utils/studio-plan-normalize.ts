import {
  STUDIO_PLAN_FEATURE_IDS,
  type StudioPlanFeatureId,
  type StudioPlanLocaleText,
} from '../constants/studio-plan-features';

const LEGACY_FEATURE_LABEL_TO_ID: Record<string, StudioPlanFeatureId> = {
  'knowledge base and actions': 'knowledge_and_actions',
  'sdk embed with dashboard config': 'sdk_embed',
  'everything in free': 'everything_in_free',
  'everything in starter': 'everything_in_starter',
  'everything in pro': 'everything_in_pro',
  'email support': 'email_support',
  'priority support': 'priority_support',
  'dedicated support': 'dedicated_support',
};

const KNOWN_FEATURE_IDS = new Set<string>(STUDIO_PLAN_FEATURE_IDS);

function trimOptional(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function mapLegacyPlanFeatureToId(value: string): StudioPlanFeatureId | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (KNOWN_FEATURE_IDS.has(trimmed)) {
    return trimmed as StudioPlanFeatureId;
  }
  return LEGACY_FEATURE_LABEL_TO_ID[trimmed.toLowerCase()] ?? null;
}

export function sanitizeStudioPlanFeatures(
  features: readonly string[] | undefined,
): StudioPlanFeatureId[] {
  if (!features?.length) {
    return [];
  }

  const seen = new Set<StudioPlanFeatureId>();
  const result: StudioPlanFeatureId[] = [];

  for (const feature of features) {
    const id = mapLegacyPlanFeatureToId(feature);
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }

  return result;
}

export function sanitizeStudioPlanLocaleText(
  value: StudioPlanLocaleText | undefined,
): StudioPlanLocaleText | undefined {
  if (!value) {
    return undefined;
  }

  const en = trimOptional(value.en);
  const fr = trimOptional(value.fr);

  if (!en && !fr) {
    return undefined;
  }

  return { ...(en ? { en } : {}), ...(fr ? { fr } : {}) };
}

export function normalizeStudioPlanLocaleText(
  value: StudioPlanLocaleText | string | undefined | null,
): StudioPlanLocaleText | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const en = trimOptional(value);
    return en ? { en } : undefined;
  }

  return sanitizeStudioPlanLocaleText(value);
}
