import {
  SDK_LABEL_TEXT_FIELDS,
  SDK_LABEL_TEXT_MAX_LENGTH,
  type SdkLabelTextField,
  type SdkLabelTexts,
} from '@ahmedrioueche/actocore-shared';

const LOCALE_CODE_PATTERN = /^[a-z]{2,3}$/;

export function normalizeTranslateLocaleCode(raw: string): string | undefined {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.split('-')[0].slice(0, 35);
}

export function isValidTranslateLocaleCode(code: string): boolean {
  return LOCALE_CODE_PATTERN.test(code);
}

export function pickTranslatableSourceLabels(
  raw: Record<string, string> | undefined,
): Partial<SdkLabelTexts> {
  const result: Partial<SdkLabelTexts> = {};

  for (const field of SDK_LABEL_TEXT_FIELDS) {
    const value = raw?.[field];
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed) {
      result[field] = trimmed;
    }
  }

  return result;
}

export function buildSdkCopyTranslateMessages(
  sourceLocale: string,
  targetLocales: string[],
  sourceLabels: Partial<SdkLabelTexts>,
): { role: 'system' | 'user'; content: string }[] {
  const fields = Object.keys(sourceLabels) as SdkLabelTextField[];

  return [
    {
      role: 'system',
      content: [
        'You translate in-app chat widget UI labels.',
        'Reply with JSON only — no markdown, no commentary.',
        `Shape: { "<locale>": { "<fieldKey>": "<translated>" } }`,
        `Translate from ${sourceLocale} to: ${targetLocales.join(', ')}.`,
        'Preserve product tone (concise, professional). Keep placeholders and punctuation style.',
        'Do not translate brand names or URLs.',
        `Allowed field keys: ${fields.join(', ')}.`,
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify({ sourceLocale, labels: sourceLabels }),
    },
  ];
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('LLM response is not valid JSON');
  }
}

export function sanitizeTranslatedLabels(
  raw: unknown,
  targetLocales: string[],
  allowedFields: readonly SdkLabelTextField[],
): Record<string, Partial<SdkLabelTexts>> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Translation payload must be a JSON object');
  }

  const allowed = new Set(targetLocales);
  const allowedFieldsSet = new Set(allowedFields);
  const result: Record<string, Partial<SdkLabelTexts>> = {};

  for (const [locale, bundle] of Object.entries(raw as Record<string, unknown>)) {
    const normalizedLocale = normalizeTranslateLocaleCode(locale);
    if (!normalizedLocale || !allowed.has(normalizedLocale)) {
      continue;
    }
    if (!bundle || typeof bundle !== 'object') {
      continue;
    }

    const labels: Partial<SdkLabelTexts> = {};
    for (const [field, value] of Object.entries(bundle as Record<string, unknown>)) {
      if (!allowedFieldsSet.has(field as SdkLabelTextField)) {
        continue;
      }
      if (typeof value !== 'string') {
        continue;
      }
      const trimmed = value.trim().replace(/<[^>]*>/g, '');
      if (!trimmed) {
        continue;
      }
      const max = SDK_LABEL_TEXT_MAX_LENGTH[field as SdkLabelTextField];
      labels[field as SdkLabelTextField] = trimmed.slice(0, max);
    }

    if (Object.keys(labels).length > 0) {
      result[normalizedLocale] = labels;
    }
  }

  if (Object.keys(result).length === 0) {
    throw new Error('No translations were returned for the requested locales');
  }

  return result;
}

export function validateTranslateRequest(
  sourceLocale: string,
  targetLocales: string[],
  sourceLabels: Partial<SdkLabelTexts>,
): void {
  const normalizedSource = normalizeTranslateLocaleCode(sourceLocale);
  if (!normalizedSource || !isValidTranslateLocaleCode(normalizedSource)) {
    throw new Error('Invalid source locale');
  }

  if (targetLocales.length === 0) {
    throw new Error('At least one target locale is required');
  }

  const normalizedTargets = targetLocales.map((locale) => {
    const code = normalizeTranslateLocaleCode(locale);
    if (!code || !isValidTranslateLocaleCode(code)) {
      throw new Error(`Invalid target locale: ${locale}`);
    }
    return code;
  });

  if (normalizedTargets.some((locale) => locale === normalizedSource)) {
    throw new Error('Target locales must differ from the source locale');
  }

  if (Object.keys(sourceLabels).length === 0) {
    throw new Error('At least one source label is required');
  }
}
