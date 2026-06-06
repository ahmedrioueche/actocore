import type { SdkThemeMode } from '@ahmedrioueche/actocore-shared';

/** Color token names aligned with Studio SDK theme editor. */
export const SDK_THEME_COLOR_TOKEN_NAMES = [
  'color-primary',
  'color-primary-contrast',
  'color-bg',
  'color-text',
  'color-text-muted',
  'color-border',
  'color-user-bubble',
  'color-user-bubble-text',
  'color-assistant-bubble',
  'color-assistant-bubble-text',
] as const;

const FONT_FAMILY_TOKEN = 'font-family';

function isPrefixedColorKey(key: string): boolean {
  return key.startsWith('light-') || key.startsWith('dark-');
}

/**
 * Resolve dashboard/host tokens for the active light/dark appearance.
 * Supports `light-color-*` / `dark-color-*` keys and legacy unprefixed overrides.
 */
export function resolveThemeTokensForMode(
  tokens: Record<string, string> | undefined,
  mode: 'light' | 'dark',
): Record<string, string> | undefined {
  if (!tokens) {
    return undefined;
  }

  const resolved: Record<string, string> = {};
  const modePrefix = `${mode}-`;

  if (tokens[FONT_FAMILY_TOKEN]) {
    resolved[FONT_FAMILY_TOKEN] = tokens[FONT_FAMILY_TOKEN];
  }

  for (const token of SDK_THEME_COLOR_TOKEN_NAMES) {
    const modeKey = `${modePrefix}${token}`;
    if (tokens[modeKey]) {
      resolved[token] = tokens[modeKey];
      continue;
    }

    const hasLight = Boolean(tokens[`light-${token}`]);
    const hasDark = Boolean(tokens[`dark-${token}`]);
    if (tokens[token] && !hasLight && !hasDark) {
      resolved[token] = tokens[token];
    }
  }

  for (const [key, value] of Object.entries(tokens)) {
    if (key === FONT_FAMILY_TOKEN || isPrefixedColorKey(key)) {
      continue;
    }
    if (!SDK_THEME_COLOR_TOKEN_NAMES.includes(key as (typeof SDK_THEME_COLOR_TOKEN_NAMES)[number])) {
      resolved[key] = value;
    }
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

export function resolveEffectiveThemeMode(
  mode: SdkThemeMode | undefined,
  prefersDark: boolean,
): 'light' | 'dark' {
  if (mode === 'dark') {
    return 'dark';
  }
  if (mode === 'light') {
    return 'light';
  }
  return prefersDark ? 'dark' : 'light';
}
