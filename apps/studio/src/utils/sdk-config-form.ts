import {
  SDK_CONFIG_COMPOSER_DEFAULTS,
  SDK_CONFIG_THEME_MODE_DEFAULT,
  SDK_CONFIG_UI_TEXT_DEFAULTS,
  SDK_CONFIG_UI_TOGGLE_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import {
  createEmptyThemeColorsByVariant,
  parseThemeColorsFromTokens,
  resolveFontFamilyFromPreset,
  resolveFontPreset,
  SDK_FONT_FAMILY_TOKEN,
  SDK_THEME_COLOR_FIELDS,
  SDK_THEME_COLOR_VARIANTS,
  themeColorStorageKey,
  type SdkThemeColorToken,
  type SdkThemeColorVariant,
  type ThemeColorsByVariant,
} from '@/constants/sdk-theme';
import { isValidHexColor, normalizeHexColor } from '@/utils/hex-color';
import type {
  SdkProjectConfigData,
  SdkThemeMode,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

export interface SdkConfigFormState {
  themeMode: SdkThemeMode;
  themeColorsByVariant: ThemeColorsByVariant;
  fontPreset: string;
  fontCustom: string;
  showSources: boolean;
  showIntentBadge: boolean;
  showActionsHint: boolean;
  showActionPicker: boolean;
  composerMinRows: number;
  composerMaxRows: number;
  headerTitle: string;
  headerSubtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  actionsHint: string;
  placeholder: string;
  send: string;
  open: string;
  launcherIconUrl: string;
  launcherAriaLabel: string;
}

export type SdkConfigFormValidationError =
  | 'composerRowsInvalid'
  | 'composerRowsOrder'
  | 'launcherIconUrlInvalid'
  | 'fieldTooLong'
  | 'invalidHexColor'
  | 'fontFamilyTooLong';

const TEXT_FIELD_LIMITS: Record<
  keyof Pick<
    SdkConfigFormState,
    | 'headerTitle'
    | 'headerSubtitle'
    | 'emptyTitle'
    | 'emptyDescription'
    | 'actionsHint'
    | 'placeholder'
    | 'send'
    | 'open'
    | 'launcherAriaLabel'
    | 'fontCustom'
  >,
  number
> = {
  headerTitle: 200,
  headerSubtitle: 400,
  emptyTitle: 200,
  emptyDescription: 600,
  actionsHint: 600,
  placeholder: 200,
  send: 80,
  open: 80,
  launcherAriaLabel: 120,
  fontCustom: 200,
};

const MAX_FONT_FAMILY_LENGTH = 200;

type SdkConfigTextField = keyof typeof SDK_CONFIG_UI_TEXT_DEFAULTS;

function resolveUiTextField(
  saved: string | undefined,
  field: SdkConfigTextField,
): string {
  const trimmed = saved?.trim() ?? '';
  return trimmed || SDK_CONFIG_UI_TEXT_DEFAULTS[field];
}

/** Omit values that match built-in SDK copy so dashboard config stays minimal. */
function uiTextFieldForPatch(
  field: SdkConfigTextField,
  value: string,
): string {
  const trimmed = trimOrEmpty(value);
  if (!trimmed || trimmed === SDK_CONFIG_UI_TEXT_DEFAULTS[field]) {
    return '';
  }
  return trimmed;
}

export function createDefaultSdkConfigFormState(): SdkConfigFormState {
  const { preset, customValue } = resolveFontPreset('');
  return {
    themeMode: SDK_CONFIG_THEME_MODE_DEFAULT,
    themeColorsByVariant: createEmptyThemeColorsByVariant(),
    fontPreset: preset,
    fontCustom: customValue,
    showSources: SDK_CONFIG_UI_TOGGLE_DEFAULTS.showSources,
    showIntentBadge: SDK_CONFIG_UI_TOGGLE_DEFAULTS.showIntentBadge,
    showActionsHint: SDK_CONFIG_UI_TOGGLE_DEFAULTS.showActionsHint,
    showActionPicker: SDK_CONFIG_UI_TOGGLE_DEFAULTS.showActionPicker,
    composerMinRows: SDK_CONFIG_COMPOSER_DEFAULTS.composerMinRows,
    composerMaxRows: SDK_CONFIG_COMPOSER_DEFAULTS.composerMaxRows,
    headerTitle: SDK_CONFIG_UI_TEXT_DEFAULTS.headerTitle,
    headerSubtitle: SDK_CONFIG_UI_TEXT_DEFAULTS.headerSubtitle,
    emptyTitle: SDK_CONFIG_UI_TEXT_DEFAULTS.emptyTitle,
    emptyDescription: SDK_CONFIG_UI_TEXT_DEFAULTS.emptyDescription,
    actionsHint: SDK_CONFIG_UI_TEXT_DEFAULTS.actionsHint,
    placeholder: SDK_CONFIG_UI_TEXT_DEFAULTS.placeholder,
    send: SDK_CONFIG_UI_TEXT_DEFAULTS.send,
    open: SDK_CONFIG_UI_TEXT_DEFAULTS.open,
    launcherIconUrl: '',
    launcherAriaLabel: SDK_CONFIG_UI_TEXT_DEFAULTS.launcherAriaLabel,
  };
}

export function configToFormState(
  config: SdkProjectConfigData,
): SdkConfigFormState {
  const defaults = createDefaultSdkConfigFormState();
  const text = config.ui?.text;
  const tokens = config.theme?.tokens ?? {};
  const themeColorsByVariant = parseThemeColorsFromTokens(tokens);

  const fontFamily =
    typeof tokens[SDK_FONT_FAMILY_TOKEN] === 'string'
      ? tokens[SDK_FONT_FAMILY_TOKEN]
      : '';
  const { preset, customValue } = resolveFontPreset(fontFamily);

  return {
    themeMode: config.theme?.mode ?? defaults.themeMode,
    themeColorsByVariant,
    fontPreset: preset,
    fontCustom: customValue,
    showSources: config.ui?.showSources ?? defaults.showSources,
    showIntentBadge: config.ui?.showIntentBadge ?? defaults.showIntentBadge,
    showActionsHint: config.ui?.showActionsHint ?? defaults.showActionsHint,
    showActionPicker: config.ui?.showActionPicker ?? defaults.showActionPicker,
    composerMinRows: config.ui?.composerMinRows ?? defaults.composerMinRows,
    composerMaxRows: config.ui?.composerMaxRows ?? defaults.composerMaxRows,
    headerTitle: resolveUiTextField(text?.headerTitle, 'headerTitle'),
    headerSubtitle: resolveUiTextField(text?.headerSubtitle, 'headerSubtitle'),
    emptyTitle: resolveUiTextField(text?.emptyTitle, 'emptyTitle'),
    emptyDescription: resolveUiTextField(
      text?.emptyDescription,
      'emptyDescription',
    ),
    actionsHint: resolveUiTextField(text?.actionsHint, 'actionsHint'),
    placeholder: resolveUiTextField(text?.placeholder, 'placeholder'),
    send: resolveUiTextField(text?.send, 'send'),
    open: resolveUiTextField(text?.open, 'open'),
    launcherIconUrl: config.ui?.launcher?.iconUrl ?? '',
    launcherAriaLabel: resolveUiTextField(
      config.ui?.launcher?.ariaLabel,
      'launcherAriaLabel',
    ),
  };
}

function trimOrEmpty(value: string): string {
  return value.trim();
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildThemeTokens(state: SdkConfigFormState): Record<string, string> {
  const tokens: Record<string, string> = {};

  for (const variant of SDK_THEME_COLOR_VARIANTS) {
    for (const field of SDK_THEME_COLOR_FIELDS) {
      const normalized = normalizeHexColor(
        state.themeColorsByVariant[variant][field.token],
      );
      if (normalized) {
        tokens[themeColorStorageKey(variant, field.token)] = normalized;
      }
    }
  }

  const fontFamily = resolveFontFamilyFromPreset(
    state.fontPreset,
    state.fontCustom,
  ).slice(0, MAX_FONT_FAMILY_LENGTH);

  if (fontFamily) {
    tokens[SDK_FONT_FAMILY_TOKEN] = fontFamily;
  }

  return tokens;
}

function validateThemeColors(
  colors: Record<SdkThemeColorToken, string>,
): boolean {
  for (const field of SDK_THEME_COLOR_FIELDS) {
    if (!isValidHexColor(colors[field.token])) {
      return false;
    }
  }
  return true;
}

export function validateSdkConfigForm(
  state: SdkConfigFormState,
): SdkConfigFormValidationError | null {
  if (
    !Number.isInteger(state.composerMinRows) ||
    !Number.isInteger(state.composerMaxRows) ||
    state.composerMinRows < 1 ||
    state.composerMinRows > 12 ||
    state.composerMaxRows < 1 ||
    state.composerMaxRows > 12
  ) {
    return 'composerRowsInvalid';
  }

  if (state.composerMinRows > state.composerMaxRows) {
    return 'composerRowsOrder';
  }

  const iconUrl = trimOrEmpty(state.launcherIconUrl);
  if (iconUrl && !isValidHttpUrl(iconUrl)) {
    return 'launcherIconUrlInvalid';
  }

  for (const variant of SDK_THEME_COLOR_VARIANTS) {
    if (!validateThemeColors(state.themeColorsByVariant[variant])) {
      return 'invalidHexColor';
    }
  }

  const fontFamily = resolveFontFamilyFromPreset(
    state.fontPreset,
    state.fontCustom,
  );
  if (fontFamily.length > MAX_FONT_FAMILY_LENGTH) {
    return 'fontFamilyTooLong';
  }

  for (const [field, maxLength] of Object.entries(TEXT_FIELD_LIMITS)) {
    const value = state[field as keyof typeof TEXT_FIELD_LIMITS];
    if (value.length > maxLength) {
      return 'fieldTooLong';
    }
  }

  return null;
}

function omitEmptyStrings(
  record: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value.length > 0),
  );
}

/** True when the current form would PATCH different values than the saved config. */
export function isSdkConfigFormDirty(
  current: SdkConfigFormState,
  saved: SdkConfigFormState,
): boolean {
  return (
    JSON.stringify(formStateToPatch(current)) !==
    JSON.stringify(formStateToPatch(saved))
  );
}

export function formStateToPatch(
  state: SdkConfigFormState,
): UpdateSdkProjectConfigDto {
  const text = omitEmptyStrings({
    headerTitle: uiTextFieldForPatch('headerTitle', state.headerTitle),
    headerSubtitle: uiTextFieldForPatch('headerSubtitle', state.headerSubtitle),
    emptyTitle: uiTextFieldForPatch('emptyTitle', state.emptyTitle),
    emptyDescription: uiTextFieldForPatch(
      'emptyDescription',
      state.emptyDescription,
    ),
    actionsHint: uiTextFieldForPatch('actionsHint', state.actionsHint),
    placeholder: uiTextFieldForPatch('placeholder', state.placeholder),
    send: uiTextFieldForPatch('send', state.send),
    open: uiTextFieldForPatch('open', state.open),
  });

  const launcher = omitEmptyStrings({
    iconUrl: trimOrEmpty(state.launcherIconUrl),
    ariaLabel: uiTextFieldForPatch('launcherAriaLabel', state.launcherAriaLabel),
  });

  const tokens = buildThemeTokens(state);

  return {
    theme: {
      mode: state.themeMode,
      tokens,
    },
    ui: {
      showSources: state.showSources,
      showIntentBadge: state.showIntentBadge,
      showActionsHint: state.showActionsHint,
      showActionPicker: state.showActionPicker,
      composerMinRows: state.composerMinRows,
      composerMaxRows: state.composerMaxRows,
      text,
      launcher,
    },
  };
}
