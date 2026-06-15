import type { SdkThemeMode } from '@ahmedrioueche/actocore-shared';

import {
  SDK_THEME_COLOR_VARIANTS,
  type SdkThemeColorVariant,
} from '@/constants/sdk-theme';

/** Themes the host app exposes to end users (Studio form model). */
export type SdkAppThemesSupport = 'both' | 'light' | 'dark';

export const SDK_APP_THEMES_OPTIONS: SdkAppThemesSupport[] = [
  'both',
  'light',
  'dark',
];

export const SDK_CONFIG_APP_THEMES_DEFAULT: SdkAppThemesSupport = 'both';

export function appThemesToSdkMode(support: SdkAppThemesSupport): SdkThemeMode {
  return support === 'both' ? 'system' : support;
}

export function sdkModeToAppThemes(
  mode: SdkThemeMode | undefined,
): SdkAppThemesSupport {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  return 'both';
}

export function visibleThemeColorVariants(
  appThemes: SdkAppThemesSupport,
): SdkThemeColorVariant[] {
  return appThemes === 'both' ? [...SDK_THEME_COLOR_VARIANTS] : [appThemes];
}
