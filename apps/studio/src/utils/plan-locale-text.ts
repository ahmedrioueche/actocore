import type { StudioPlanLocaleText } from '@ahmedrioueche/actocore-shared';

export function resolvePlanLocaleText(
  text: StudioPlanLocaleText | string | undefined,
  language: string,
): string | undefined {
  if (!text) {
    return undefined;
  }

  if (typeof text === 'string') {
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  const preferFrench = language.toLowerCase().startsWith('fr');
  const primary = preferFrench ? text.fr : text.en;
  const fallback = preferFrench ? text.en : text.fr;
  const chosen = primary?.trim() || fallback?.trim();
  return chosen && chosen.length > 0 ? chosen : undefined;
}
