/** SDK `--ac-*` token keys exposed in Studio (without `--ac-` prefix). */
export const SDK_THEME_COLOR_FIELDS = [
  { token: 'color-primary' },
  { token: 'color-primary-contrast' },
  { token: 'color-bg' },
  { token: 'color-text' },
  { token: 'color-text-muted' },
  { token: 'color-border' },
  { token: 'color-user-bubble' },
  { token: 'color-user-bubble-text' },
  { token: 'color-assistant-bubble' },
  { token: 'color-assistant-bubble-text' },
] as const;

export type SdkThemeColorToken =
  (typeof SDK_THEME_COLOR_FIELDS)[number]['token'];

export type SdkThemeColorVariant = 'light' | 'dark';

export const SDK_THEME_COLOR_VARIANTS: SdkThemeColorVariant[] = [
  'light',
  'dark',
];

/** Built-in SDK defaults from packages/sdk/src/styles/tokens.css */
export const SDK_THEME_COLOR_DEFAULTS: Record<
  SdkThemeColorVariant,
  Record<SdkThemeColorToken, string>
> = {
  light: {
    'color-primary': '#4f46e5',
    'color-primary-contrast': '#ffffff',
    'color-bg': '#ffffff',
    'color-text': '#0f172a',
    'color-text-muted': '#64748b',
    'color-border': '#e2e8f3',
    'color-user-bubble': '#4f46e5',
    'color-user-bubble-text': '#ffffff',
    'color-assistant-bubble': '#ffffff',
    'color-assistant-bubble-text': '#0f172a',
  },
  dark: {
    'color-primary': '#6366f1',
    'color-primary-contrast': '#ffffff',
    'color-bg': '#0f172a',
    'color-text': '#f1f5f9',
    'color-text-muted': '#94a3b8',
    'color-border': '#334155',
    'color-user-bubble': '#4f46e5',
    'color-user-bubble-text': '#ffffff',
    'color-assistant-bubble': '#1e293b',
    'color-assistant-bubble-text': '#f1f5f9',
  },
};

export const SDK_FONT_FAMILY_TOKEN = 'font-family';

export function themeColorStorageKey(
  variant: SdkThemeColorVariant,
  token: SdkThemeColorToken,
): string {
  return `${variant}-${token}`;
}

export type ThemeColorsByVariant = Record<
  SdkThemeColorVariant,
  Record<SdkThemeColorToken, string>
>;

export function createEmptyThemeColorsByVariant(): ThemeColorsByVariant {
  return {
    light: createEmptyThemeColorsForVariant('light'),
    dark: createEmptyThemeColorsForVariant('dark'),
  };
}

export function createEmptyThemeColorsForVariant(
  variant: SdkThemeColorVariant,
): Record<SdkThemeColorToken, string> {
  return Object.fromEntries(
    SDK_THEME_COLOR_FIELDS.map((field) => [field.token, '']),
  ) as Record<SdkThemeColorToken, string>;
}

/** Read stored theme tokens into light/dark editor state. */
export function parseThemeColorsFromTokens(
  tokens: Record<string, string>,
): ThemeColorsByVariant {
  const colors = createEmptyThemeColorsByVariant();

  for (const field of SDK_THEME_COLOR_FIELDS) {
    const lightKey = themeColorStorageKey('light', field.token);
    const darkKey = themeColorStorageKey('dark', field.token);
    const legacy = tokens[field.token];

    if (typeof tokens[lightKey] === 'string') {
      colors.light[field.token] = tokens[lightKey];
    } else if (typeof legacy === 'string') {
      colors.light[field.token] = legacy;
    }

    if (typeof tokens[darkKey] === 'string') {
      colors.dark[field.token] = tokens[darkKey];
    }
  }

  return colors;
}

export const SDK_FONT_PRESET_CUSTOM = '__custom__';

export const SDK_FONT_PRESETS = [
  {
    value: '',
    labelKey: 'systemDefault',
  },
  {
    value: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    labelKey: 'inter',
  },
  {
    value: "Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif",
    labelKey: 'roboto',
  },
  {
    value: "'Open Sans', system-ui, -apple-system, sans-serif",
    labelKey: 'openSans',
  },
  {
    value: "Georgia, 'Times New Roman', serif",
    labelKey: 'georgia',
  },
  {
    value: "'Courier New', Courier, monospace",
    labelKey: 'monospace',
  },
  {
    value: SDK_FONT_PRESET_CUSTOM,
    labelKey: 'custom',
  },
] as const;

export function resolveFontPreset(
  fontFamily: string,
): { preset: string; customValue: string } {
  if (!fontFamily.trim()) {
    return { preset: '', customValue: '' };
  }

  const match = SDK_FONT_PRESETS.find(
    (option) =>
      option.value !== SDK_FONT_PRESET_CUSTOM && option.value === fontFamily,
  );

  if (match) {
    return { preset: match.value, customValue: fontFamily };
  }

  return { preset: SDK_FONT_PRESET_CUSTOM, customValue: fontFamily };
}

export function resolveFontFamilyFromPreset(
  preset: string,
  customValue: string,
): string {
  if (!preset) {
    return '';
  }
  if (preset === SDK_FONT_PRESET_CUSTOM) {
    return customValue.trim();
  }
  return preset;
}
