import {
  appThemesToSdkMode,
  SDK_CONFIG_APP_THEMES_DEFAULT,
  sdkModeToAppThemes,
  visibleThemeColorVariants,
  type SdkAppThemesSupport,
} from '@/constants/sdk-app-themes';
import {
  SDK_CONFIG_COMPOSER_DEFAULTS,
  SDK_CONFIG_INLINE_DEFAULTS,
  SDK_CONFIG_LAUNCHER_DEFAULTS,
  SDK_CONFIG_PRESENTATION_DEFAULT,
  SDK_CONFIG_UI_TEXT_DEFAULTS,
  SDK_CONFIG_UI_TOGGLE_DEFAULTS,
  SDK_CONFIG_WIDGET_DEFAULTS,
} from '@/constants/sdk-config-defaults';
import {
  createEmptyThemeColorsByVariant,
  parseThemeColorsFromTokens,
  resolveFontFamilyFromPreset,
  resolveFontPreset,
  SDK_FONT_FAMILY_TOKEN,
  SDK_THEME_COLOR_FIELDS,
  themeColorStorageKey,
  type SdkThemeColorToken,
  type ThemeColorsByVariant,
} from '@/constants/sdk-theme';
import { isValidHexColor, normalizeHexColor } from '@/utils/hex-color';
import type {
  SdkLauncherPlacement,
  SdkLauncherVariant,
  SdkPresentationMode,
  SdkProjectConfigData,
  SdkWidgetPanelLayout,
  SdkWidgetPosition,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

export interface SdkConfigFormState {
  appThemes: SdkAppThemesSupport;
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
  newConversation: string;
  minimize: string;
  stop: string;
  launcherIconUrl: string;
  launcherAriaLabel: string;
  launcherPlacement: SdkLauncherPlacement;
  launcherVariant: SdkLauncherVariant;
  launcherLabel: string;
  launcherPosition: SdkWidgetPosition;
  launcherOffsetX: string;
  launcherOffsetY: string;
  presentation: SdkPresentationMode;
  panelLayout: SdkWidgetPanelLayout;
  panelWidth: string;
  panelHeight: string;
  widgetZIndex: string;
  hideWhenSelector: string;
  inlineMaxWidth: string;
  inlineHeight: string;
  inlineMinHeight: string;
}

export type SdkConfigFormValidationError =
  | 'composerRowsInvalid'
  | 'composerRowsOrder'
  | 'launcherIconUrlInvalid'
  | 'launcherOffsetInvalid'
  | 'layoutSizeInvalid'
  | 'widgetZIndexInvalid'
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
    | 'newConversation'
    | 'minimize'
    | 'stop'
    | 'launcherAriaLabel'
    | 'launcherLabel'
    | 'launcherOffsetX'
    | 'launcherOffsetY'
    | 'fontCustom'
    | 'panelWidth'
    | 'panelHeight'
    | 'hideWhenSelector'
    | 'inlineMaxWidth'
    | 'inlineHeight'
    | 'inlineMinHeight'
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
  newConversation: 80,
  minimize: 80,
  stop: 80,
  launcherAriaLabel: 120,
  launcherLabel: 80,
  launcherOffsetX: 20,
  launcherOffsetY: 20,
  fontCustom: 200,
  panelWidth: 40,
  panelHeight: 80,
  hideWhenSelector: 200,
  inlineMaxWidth: 40,
  inlineHeight: 80,
  inlineMinHeight: 80,
};

const MAX_FONT_FAMILY_LENGTH = 200;
const CSS_LENGTH_PATTERN = /^\d+(\.\d+)?(px|rem|em|%|vh|vw|dvh)$/;
const CSS_SIZE_PATTERN =
  /^(min|max|calc)\(.+\)$|^\d+(\.\d+)?(px|rem|em|%|vh|vw|dvh)$/;

function isValidCssLength(value: string): boolean {
  return CSS_LENGTH_PATTERN.test(value.trim());
}

function isValidCssSize(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  return CSS_SIZE_PATTERN.test(trimmed) || isValidCssLength(trimmed);
}

type SdkUiTextFormField = Exclude<
  keyof typeof SDK_CONFIG_UI_TEXT_DEFAULTS,
  'launcherAriaLabel'
>;

function resolveUiTextField(
  saved: string | undefined,
  field: SdkUiTextFormField,
): string {
  const trimmed = saved?.trim() ?? '';
  return trimmed || SDK_CONFIG_UI_TEXT_DEFAULTS[field];
}

function resolveLauncherOpenLabel(config: SdkProjectConfigData): string {
  const aria = config.ui?.launcher?.ariaLabel?.trim();
  if (aria) {
    return aria;
  }
  const open = config.ui?.text?.open?.trim();
  if (open) {
    return open;
  }
  return SDK_CONFIG_UI_TEXT_DEFAULTS.launcherAriaLabel;
}

/** Omit values that match built-in SDK copy so dashboard config stays minimal. */
function uiTextFieldForPatch(
  field: SdkUiTextFormField,
  value: string,
  saved?: SdkProjectConfigData,
): string | null | undefined {
  const trimmed = trimOrEmpty(value);
  const isDefault =
    !trimmed || trimmed === SDK_CONFIG_UI_TEXT_DEFAULTS[field];
  const hadSaved = saved?.ui?.text?.[field] !== undefined;

  if (isDefault) {
    return hadSaved ? null : undefined;
  }
  return trimmed;
}

function stringFieldForPatch(
  value: string,
  isDefault: boolean,
  hadSaved: boolean,
): string | null | undefined {
  const trimmed = trimOrEmpty(value);
  if (isDefault) {
    return hadSaved ? null : undefined;
  }
  return trimmed;
}

function enumFieldForPatch<T extends string>(
  value: T,
  defaultValue: T,
  savedValue: T | undefined,
): T | null | undefined {
  if (value === defaultValue) {
    return savedValue !== undefined ? null : undefined;
  }
  return value;
}

function launcherAriaLabelForPatch(
  value: string,
  saved?: SdkProjectConfigData,
): string | null | undefined {
  const trimmed = trimOrEmpty(value);
  const isDefault =
    !trimmed || trimmed === SDK_CONFIG_UI_TEXT_DEFAULTS.launcherAriaLabel;
  const hadSaved = saved?.ui?.launcher?.ariaLabel !== undefined;

  if (isDefault) {
    return hadSaved ? null : undefined;
  }
  return trimmed;
}

function buildNullablePatchRecord<T extends string>(
  entries: Record<string, T | null | undefined>,
): Record<string, T | null> | undefined {
  const result: Record<string, T | null> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) {
      continue;
    }
    result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function createDefaultSdkConfigFormState(): SdkConfigFormState {
  const { preset, customValue } = resolveFontPreset('');
  return {
    appThemes: SDK_CONFIG_APP_THEMES_DEFAULT,
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
    newConversation: SDK_CONFIG_UI_TEXT_DEFAULTS.newConversation,
    minimize: SDK_CONFIG_UI_TEXT_DEFAULTS.minimize,
    stop: SDK_CONFIG_UI_TEXT_DEFAULTS.stop,
    launcherIconUrl: '',
    launcherAriaLabel: SDK_CONFIG_UI_TEXT_DEFAULTS.launcherAriaLabel,
    launcherPlacement: SDK_CONFIG_LAUNCHER_DEFAULTS.placement,
    launcherVariant: SDK_CONFIG_LAUNCHER_DEFAULTS.variant,
    launcherLabel: SDK_CONFIG_LAUNCHER_DEFAULTS.label,
    launcherPosition: SDK_CONFIG_WIDGET_DEFAULTS.position,
    launcherOffsetX: SDK_CONFIG_WIDGET_DEFAULTS.offsetX,
    launcherOffsetY: SDK_CONFIG_WIDGET_DEFAULTS.offsetY,
    presentation: SDK_CONFIG_PRESENTATION_DEFAULT,
    panelLayout: SDK_CONFIG_WIDGET_DEFAULTS.panelLayout,
    panelWidth: SDK_CONFIG_WIDGET_DEFAULTS.panelWidth,
    panelHeight: SDK_CONFIG_WIDGET_DEFAULTS.panelHeight,
    widgetZIndex: '',
    hideWhenSelector: '',
    inlineMaxWidth: SDK_CONFIG_INLINE_DEFAULTS.maxWidth,
    inlineHeight: SDK_CONFIG_INLINE_DEFAULTS.height,
    inlineMinHeight: SDK_CONFIG_INLINE_DEFAULTS.minHeight,
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
    appThemes: sdkModeToAppThemes(config.theme?.mode),
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
    newConversation: resolveUiTextField(text?.newConversation, 'newConversation'),
    minimize: resolveUiTextField(text?.minimize, 'minimize'),
    stop: resolveUiTextField(text?.stop, 'stop'),
    launcherIconUrl: config.ui?.launcher?.iconUrl ?? '',
    launcherAriaLabel: resolveLauncherOpenLabel(config),
    launcherPlacement:
      config.ui?.launcher?.placement ?? SDK_CONFIG_LAUNCHER_DEFAULTS.placement,
    launcherVariant:
      config.ui?.launcher?.variant ?? SDK_CONFIG_LAUNCHER_DEFAULTS.variant,
    launcherLabel: config.ui?.launcher?.label?.trim() ?? '',
    launcherPosition:
      config.ui?.widget?.position ?? SDK_CONFIG_WIDGET_DEFAULTS.position,
    launcherOffsetX:
      config.ui?.widget?.offsetX?.trim() || SDK_CONFIG_WIDGET_DEFAULTS.offsetX,
    launcherOffsetY:
      config.ui?.widget?.offsetY?.trim() || SDK_CONFIG_WIDGET_DEFAULTS.offsetY,
    presentation: config.ui?.presentation ?? SDK_CONFIG_PRESENTATION_DEFAULT,
    panelLayout:
      config.ui?.widget?.panelLayout ?? SDK_CONFIG_WIDGET_DEFAULTS.panelLayout,
    panelWidth:
      config.ui?.widget?.panelWidth?.trim() || SDK_CONFIG_WIDGET_DEFAULTS.panelWidth,
    panelHeight:
      config.ui?.widget?.panelHeight?.trim() || SDK_CONFIG_WIDGET_DEFAULTS.panelHeight,
    widgetZIndex:
      config.ui?.widget?.zIndex != null ? String(config.ui.widget.zIndex) : '',
    hideWhenSelector: config.ui?.widget?.hideWhenSelector?.trim() ?? '',
    inlineMaxWidth:
      config.ui?.inline?.maxWidth?.trim() || SDK_CONFIG_INLINE_DEFAULTS.maxWidth,
    inlineHeight:
      config.ui?.inline?.height?.trim() || SDK_CONFIG_INLINE_DEFAULTS.height,
    inlineMinHeight:
      config.ui?.inline?.minHeight?.trim() || SDK_CONFIG_INLINE_DEFAULTS.minHeight,
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

  for (const variant of visibleThemeColorVariants(state.appThemes)) {
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

  const offsetX = trimOrEmpty(state.launcherOffsetX);
  const offsetY = trimOrEmpty(state.launcherOffsetY);
  if (
    (offsetX && !isValidCssLength(offsetX)) ||
    (offsetY && !isValidCssLength(offsetY))
  ) {
    return 'launcherOffsetInvalid';
  }

  const panelWidth = trimOrEmpty(state.panelWidth);
  const panelHeight = trimOrEmpty(state.panelHeight);
  if (
    (panelWidth && !isValidCssSize(panelWidth)) ||
    (panelHeight && !isValidCssSize(panelHeight))
  ) {
    return 'layoutSizeInvalid';
  }

  const inlineMaxWidth = trimOrEmpty(state.inlineMaxWidth);
  const inlineHeight = trimOrEmpty(state.inlineHeight);
  const inlineMinHeight = trimOrEmpty(state.inlineMinHeight);
  if (
    (inlineMaxWidth && !isValidCssSize(inlineMaxWidth)) ||
    (inlineHeight && !isValidCssSize(inlineHeight)) ||
    (inlineMinHeight && !isValidCssSize(inlineMinHeight))
  ) {
    return 'layoutSizeInvalid';
  }

  const zIndexRaw = trimOrEmpty(state.widgetZIndex);
  if (zIndexRaw) {
    const zIndex = Number.parseInt(zIndexRaw, 10);
    if (!Number.isInteger(zIndex) || zIndex < 1 || zIndex > 999_999) {
      return 'widgetZIndexInvalid';
    }
  }

  for (const variant of visibleThemeColorVariants(state.appThemes)) {
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

/** True when the current form would PATCH different values than the saved config. */
export function isSdkConfigFormDirty(
  current: SdkConfigFormState,
  saved: SdkConfigFormState,
  savedConfig?: SdkProjectConfigData,
): boolean {
  return (
    JSON.stringify(formStateToPatch(current, savedConfig)) !==
    JSON.stringify(formStateToPatch(saved, savedConfig))
  );
}

export function formStateToPatch(
  state: SdkConfigFormState,
  saved?: SdkProjectConfigData,
): UpdateSdkProjectConfigDto {
  const text = buildNullablePatchRecord({
    headerTitle: uiTextFieldForPatch('headerTitle', state.headerTitle, saved),
    headerSubtitle: uiTextFieldForPatch(
      'headerSubtitle',
      state.headerSubtitle,
      saved,
    ),
    emptyTitle: uiTextFieldForPatch('emptyTitle', state.emptyTitle, saved),
    emptyDescription: uiTextFieldForPatch(
      'emptyDescription',
      state.emptyDescription,
      saved,
    ),
    actionsHint: uiTextFieldForPatch('actionsHint', state.actionsHint, saved),
    placeholder: uiTextFieldForPatch('placeholder', state.placeholder, saved),
    send: uiTextFieldForPatch('send', state.send, saved),
    open: uiTextFieldForPatch('open', state.open, saved),
    newConversation: uiTextFieldForPatch(
      'newConversation',
      state.newConversation,
      saved,
    ),
    minimize: uiTextFieldForPatch('minimize', state.minimize, saved),
    stop: uiTextFieldForPatch('stop', state.stop, saved),
  });

  const launcher = buildNullablePatchRecord({
    iconUrl: stringFieldForPatch(
      state.launcherIconUrl,
      trimOrEmpty(state.launcherIconUrl) === '',
      saved?.ui?.launcher?.iconUrl !== undefined,
    ),
    ariaLabel: launcherAriaLabelForPatch(state.launcherAriaLabel, saved),
    placement: enumFieldForPatch(
      state.launcherPlacement,
      SDK_CONFIG_LAUNCHER_DEFAULTS.placement,
      saved?.ui?.launcher?.placement,
    ),
    variant: enumFieldForPatch(
      state.launcherVariant,
      SDK_CONFIG_LAUNCHER_DEFAULTS.variant,
      saved?.ui?.launcher?.variant,
    ),
    label: stringFieldForPatch(
      state.launcherLabel,
      trimOrEmpty(state.launcherLabel) === '',
      saved?.ui?.launcher?.label !== undefined,
    ),
  });

  const widgetFields = buildNullablePatchRecord({
    position: enumFieldForPatch(
      state.launcherPosition,
      SDK_CONFIG_WIDGET_DEFAULTS.position,
      saved?.ui?.widget?.position,
    ),
    offsetX: stringFieldForPatch(
      state.launcherOffsetX,
      trimOrEmpty(state.launcherOffsetX) === SDK_CONFIG_WIDGET_DEFAULTS.offsetX,
      saved?.ui?.widget?.offsetX !== undefined,
    ),
    offsetY: stringFieldForPatch(
      state.launcherOffsetY,
      trimOrEmpty(state.launcherOffsetY) === SDK_CONFIG_WIDGET_DEFAULTS.offsetY,
      saved?.ui?.widget?.offsetY !== undefined,
    ),
    panelLayout: enumFieldForPatch(
      state.panelLayout,
      SDK_CONFIG_WIDGET_DEFAULTS.panelLayout,
      saved?.ui?.widget?.panelLayout,
    ),
    panelWidth: stringFieldForPatch(
      state.panelWidth,
      trimOrEmpty(state.panelWidth) === SDK_CONFIG_WIDGET_DEFAULTS.panelWidth,
      saved?.ui?.widget?.panelWidth !== undefined,
    ),
    panelHeight: stringFieldForPatch(
      state.panelHeight,
      trimOrEmpty(state.panelHeight) === '',
      saved?.ui?.widget?.panelHeight !== undefined,
    ),
    hideWhenSelector: stringFieldForPatch(
      state.hideWhenSelector,
      trimOrEmpty(state.hideWhenSelector) === '',
      saved?.ui?.widget?.hideWhenSelector !== undefined,
    ),
  });

  const zIndexRaw = trimOrEmpty(state.widgetZIndex);
  const zIndexPatch =
    zIndexRaw !== ''
      ? { zIndex: Number.parseInt(zIndexRaw, 10) }
      : saved?.ui?.widget?.zIndex !== undefined
        ? { zIndex: null }
        : undefined;

  const widget =
    widgetFields || zIndexPatch
      ? {
          ...(widgetFields ?? {}),
          ...(zIndexPatch ?? {}),
        }
      : undefined;

  const inline = buildNullablePatchRecord({
    maxWidth: stringFieldForPatch(
      state.inlineMaxWidth,
      trimOrEmpty(state.inlineMaxWidth) === SDK_CONFIG_INLINE_DEFAULTS.maxWidth,
      saved?.ui?.inline?.maxWidth !== undefined,
    ),
    height: stringFieldForPatch(
      state.inlineHeight,
      trimOrEmpty(state.inlineHeight) === SDK_CONFIG_INLINE_DEFAULTS.height,
      saved?.ui?.inline?.height !== undefined,
    ),
    minHeight: stringFieldForPatch(
      state.inlineMinHeight,
      trimOrEmpty(state.inlineMinHeight) === SDK_CONFIG_INLINE_DEFAULTS.minHeight,
      saved?.ui?.inline?.minHeight !== undefined,
    ),
  });

  const tokens = buildThemeTokens(state);

  const ui: NonNullable<UpdateSdkProjectConfigDto['ui']> = {
    showSources: state.showSources,
    showIntentBadge: state.showIntentBadge,
    showActionsHint: state.showActionsHint,
    showActionPicker: state.showActionPicker,
    composerMinRows: state.composerMinRows,
    composerMaxRows: state.composerMaxRows,
  };

  if (
    state.presentation !== SDK_CONFIG_PRESENTATION_DEFAULT ||
    saved?.ui?.presentation !== undefined
  ) {
    (ui as { presentation?: SdkPresentationMode | null }).presentation =
      state.presentation === SDK_CONFIG_PRESENTATION_DEFAULT
        ? null
        : state.presentation;
  }

  if (text) {
    ui.text = text as NonNullable<UpdateSdkProjectConfigDto['ui']>['text'];
  }
  if (launcher) {
    ui.launcher = launcher as NonNullable<
      UpdateSdkProjectConfigDto['ui']
    >['launcher'];
  }
  if (widget) {
    ui.widget = widget as NonNullable<UpdateSdkProjectConfigDto['ui']>['widget'];
  }
  if (inline) {
    ui.inline = inline as NonNullable<UpdateSdkProjectConfigDto['ui']>['inline'];
  }

  return {
    theme: {
      mode: appThemesToSdkMode(state.appThemes),
      tokens,
    },
    ui: ui as UpdateSdkProjectConfigDto['ui'],
  };
}
