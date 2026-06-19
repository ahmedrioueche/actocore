import type {
  SdkHeaderConfig,
  SdkInlineConfig,
  SdkLauncherConfig,
  SdkLauncherPlacement,
  SdkLauncherVariant,
  SdkPresentationMode,
  SdkProjectConfigData,
  SdkUiTextOverrides,
  SdkWidgetConfig,
  SdkWidgetPanelLayout,
  SdkWidgetPosition,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

const WIDGET_POSITIONS: readonly SdkWidgetPosition[] = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

const PRESENTATION_MODES: readonly SdkPresentationMode[] = ['widget', 'inline'];

const WIDGET_PANEL_LAYOUTS: readonly SdkWidgetPanelLayout[] = [
  'overlay',
  'dock-right',
  'dock-left',
];

const LAUNCHER_PLACEMENTS: readonly SdkLauncherPlacement[] = ['floating', 'host'];
const LAUNCHER_VARIANTS: readonly SdkLauncherVariant[] = ['icon', 'button', 'link'];

export const SDK_CONFIG_MAX_TRANSLATIONS_BYTES = 32_768;
export const SDK_CONFIG_MAX_ALLOWED_ACTIONS = 50;
export const SDK_CONFIG_MAX_THEME_TOKENS = 40;

export function emptySdkProjectConfig(): SdkProjectConfigData {
  return { sdkConfigVersion: 0 };
}

export function deepMergeSdkConfig(
  current: SdkProjectConfigData,
  patch: UpdateSdkProjectConfigDto,
): SdkProjectConfigData {
  const merged: SdkProjectConfigData = {
    sdkConfigVersion: current.sdkConfigVersion,
    i18n: patch.i18n !== undefined ? mergeSection(current.i18n, patch.i18n) : current.i18n,
    theme:
      patch.theme !== undefined ? mergeTheme(current.theme, patch.theme) : current.theme,
    security:
      patch.security !== undefined
        ? mergeSection(current.security, patch.security)
        : current.security,
    ui: patch.ui !== undefined ? mergeUi(current.ui, patch.ui) : current.ui,
    voice:
      patch.voice !== undefined ? mergeSection(current.voice, patch.voice) : current.voice,
  };

  return normalizeSdkConfig(merged);
}

function mergeTheme(
  base: SdkProjectConfigData['theme'],
  patch: NonNullable<UpdateSdkProjectConfigDto['theme']>,
): SdkProjectConfigData['theme'] {
  const merged = mergeSection(base, patch);
  if (patch.tokens !== undefined) {
    const tokens = mergeNullableStringRecord(base?.tokens, patch.tokens);
    if (tokens) {
      merged.tokens = tokens;
    } else {
      delete merged.tokens;
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function mergeUi(
  base: SdkProjectConfigData['ui'],
  patch: NonNullable<UpdateSdkProjectConfigDto['ui']>,
): SdkProjectConfigData['ui'] {
  const merged: NonNullable<SdkProjectConfigData['ui']> = {
    ...(base ?? {}),
  };

  if (patch.presentation !== undefined) {
    if (patch.presentation === null) {
      delete merged.presentation;
    } else {
      merged.presentation = patch.presentation;
    }
  }
  if (patch.showSources !== undefined) merged.showSources = patch.showSources;
  if (patch.showIntentBadge !== undefined) {
    merged.showIntentBadge = patch.showIntentBadge;
  }
  if (patch.showActionsHint !== undefined) {
    merged.showActionsHint = patch.showActionsHint;
  }
  if (patch.showActionPicker !== undefined) {
    merged.showActionPicker = patch.showActionPicker;
  }
  if (patch.composerMinRows !== undefined) {
    merged.composerMinRows = patch.composerMinRows;
  }
  if (patch.composerMaxRows !== undefined) {
    merged.composerMaxRows = patch.composerMaxRows;
  }

  if (patch.text !== undefined) {
    const text = mergeNullableStringRecord<SdkUiTextOverrides>(
      base?.text,
      patch.text as Record<string, string | null> | undefined,
    );
    if (text) {
      merged.text = text;
    } else {
      delete merged.text;
    }
  }

  if (patch.header !== undefined) {
    const header = mergeHeader(base?.header, patch.header);
    if (header) {
      merged.header = header;
    } else {
      delete merged.header;
    }
  }

  if (patch.launcher !== undefined) {
    const launcher = mergeLauncher(base?.launcher, patch.launcher);
    if (launcher) {
      merged.launcher = launcher;
    } else {
      delete merged.launcher;
    }
  }

  if (patch.widget !== undefined) {
    const widget = mergeWidget(base?.widget, patch.widget);
    if (widget) {
      merged.widget = widget;
    } else {
      delete merged.widget;
    }
  }

  if (patch.inline !== undefined) {
    const inline = mergeNullableStringRecord<SdkInlineConfig>(
      base?.inline,
      patch.inline as Record<string, string | null> | undefined,
    );
    if (inline) {
      merged.inline = inline;
    } else {
      delete merged.inline;
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

type NullablePatch<T> = {
  [K in keyof T]?: T[K] | null;
};

function mergeNullableStringRecord<T>(
  base: T | undefined,
  patch: Record<string, string | null> | undefined,
): T | undefined {
  if (patch === undefined) {
    return base;
  }

  const result = { ...(base ?? {}) } as Record<string, string>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete result[key];
    } else if (typeof value === 'string' && value.length > 0) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? (result as T) : undefined;
}

function mergeLauncher(
  base: SdkLauncherConfig | undefined,
  patch: NullablePatch<SdkLauncherConfig> | undefined,
): SdkLauncherConfig | undefined {
  if (patch === undefined) {
    return base;
  }

  const result: SdkLauncherConfig = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(patch) as Array<
    [keyof SdkLauncherConfig, SdkLauncherConfig[keyof SdkLauncherConfig] | null]
  >) {
    if (value === null) {
      delete result[key];
    } else if (value !== undefined && value !== '') {
      result[key] = value as never;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function mergeHeader(
  base: SdkHeaderConfig | undefined,
  patch: NullablePatch<SdkHeaderConfig> | undefined,
): SdkHeaderConfig | undefined {
  if (patch === undefined) {
    return base;
  }

  const result: SdkHeaderConfig = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(patch) as Array<
    [keyof SdkHeaderConfig, SdkHeaderConfig[keyof SdkHeaderConfig] | null]
  >) {
    if (value === null) {
      delete result[key];
    } else if (value !== undefined && value !== '') {
      result[key] = value as never;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function mergeWidget(
  base: SdkWidgetConfig | undefined,
  patch: NullablePatch<SdkWidgetConfig> | undefined,
): SdkWidgetConfig | undefined {
  if (patch === undefined) {
    return base;
  }

  const result: SdkWidgetConfig = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(patch) as Array<
    [keyof SdkWidgetConfig, SdkWidgetConfig[keyof SdkWidgetConfig] | null]
  >) {
    if (value === null) {
      delete result[key];
    } else if (value !== undefined && value !== '') {
      result[key] = value as never;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function mergeSection<T extends object>(base: T | undefined, patch: Partial<T>): T {
  return { ...(base ?? ({} as T)), ...patch };
}

export function normalizeSdkConfig(raw: unknown): SdkProjectConfigData {
  if (!raw || typeof raw !== 'object') {
    return emptySdkProjectConfig();
  }

  const input = raw as Record<string, unknown>;
  const version =
    typeof input.sdkConfigVersion === 'number' && input.sdkConfigVersion >= 0
      ? Math.floor(input.sdkConfigVersion)
      : 0;

  const config: SdkProjectConfigData = { sdkConfigVersion: version };

  const i18n = pickI18n(input.i18n);
  if (i18n) config.i18n = i18n;

  const theme = pickTheme(input.theme);
  if (theme) config.theme = theme;

  const security = pickSecurity(input.security);
  if (security) config.security = security;

  const ui = pickUi(input.ui);
  if (ui) config.ui = ui;

  const voice = pickVoice(input.voice);
  if (voice) config.voice = voice;

  return config;
}

export function assertSdkConfigLimits(config: SdkProjectConfigData): void {
  if (config.i18n?.translations) {
    const size = JSON.stringify(config.i18n.translations).length;
    if (size > SDK_CONFIG_MAX_TRANSLATIONS_BYTES) {
      throw new Error(
        `translations exceed maximum size of ${SDK_CONFIG_MAX_TRANSLATIONS_BYTES} bytes`,
      );
    }
  }

  const allowlist = config.security?.allowedActionNames;
  if (allowlist && allowlist.length > SDK_CONFIG_MAX_ALLOWED_ACTIONS) {
    throw new Error(
      `allowedActionNames exceeds maximum of ${SDK_CONFIG_MAX_ALLOWED_ACTIONS} entries`,
    );
  }

  const tokenCount = config.theme?.tokens
    ? Object.keys(config.theme.tokens).length
    : 0;
  if (tokenCount > SDK_CONFIG_MAX_THEME_TOKENS) {
    throw new Error(
      `theme.tokens exceeds maximum of ${SDK_CONFIG_MAX_THEME_TOKENS} keys`,
    );
  }
}

function pickI18n(raw: unknown): SdkProjectConfigData['i18n'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const locale = typeof o.locale === 'string' ? o.locale.trim() : undefined;
  const translations =
    o.translations && typeof o.translations === 'object'
      ? (o.translations as Record<string, Record<string, unknown>>)
      : undefined;
  if (!locale && !translations) return undefined;
  return { locale, translations };
}

function pickTheme(raw: unknown): SdkProjectConfigData['theme'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const mode =
    o.mode === 'light' || o.mode === 'dark' || o.mode === 'system'
      ? o.mode
      : undefined;
  const className = typeof o.className === 'string' ? o.className : undefined;
  const tokens = pickStringRecord(o.tokens);
  if (!mode && !className && !tokens) return undefined;
  return { mode, className, tokens };
}

function pickSecurity(raw: unknown): SdkProjectConfigData['security'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const allowedActionNames = Array.isArray(o.allowedActionNames)
    ? o.allowedActionNames.filter((n): n is string => typeof n === 'string')
    : undefined;
  const allowedSectionIds = Array.isArray(o.allowedSectionIds)
    ? o.allowedSectionIds.filter((n): n is string => typeof n === 'string')
    : undefined;
  const enforceActionAllowlist =
    typeof o.enforceActionAllowlist === 'boolean'
      ? o.enforceActionAllowlist
      : undefined;
  if (
    !allowedActionNames?.length &&
    !allowedSectionIds?.length &&
    enforceActionAllowlist === undefined
  ) {
    return undefined;
  }
  return { allowedActionNames, allowedSectionIds, enforceActionAllowlist };
}

function pickUi(raw: unknown): SdkProjectConfigData['ui'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const result: NonNullable<SdkProjectConfigData['ui']> = {};

  if (
    typeof o.presentation === 'string' &&
    (PRESENTATION_MODES as readonly string[]).includes(o.presentation)
  ) {
    result.presentation = o.presentation as SdkPresentationMode;
  }

  if (typeof o.showSources === 'boolean') result.showSources = o.showSources;
  if (typeof o.showIntentBadge === 'boolean') {
    result.showIntentBadge = o.showIntentBadge;
  }
  if (typeof o.showActionsHint === 'boolean') {
    result.showActionsHint = o.showActionsHint;
  }
  if (typeof o.showActionPicker === 'boolean') {
    result.showActionPicker = o.showActionPicker;
  }
  if (typeof o.composerMinRows === 'number') {
    result.composerMinRows = o.composerMinRows;
  }
  if (typeof o.composerMaxRows === 'number') {
    result.composerMaxRows = o.composerMaxRows;
  }

  const text = pickUiText(o.text);
  if (text) result.text = text;

  const header = pickHeader(o.header);
  if (header) result.header = header;

  const launcher = pickLauncher(o.launcher);
  if (launcher) result.launcher = launcher;

  const widget = pickWidget(o.widget);
  if (widget) result.widget = widget;

  const inline = pickInline(o.inline);
  if (inline) result.inline = inline;

  return Object.keys(result).length > 0 ? result : undefined;
}

function pickUiText(raw: unknown): SdkUiTextOverrides | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const keys = [
    'headerTitle',
    'headerSubtitle',
    'emptyTitle',
    'emptyDescription',
    'actionsHint',
    'placeholder',
    'send',
    'open',
    'newConversation',
    'minimize',
    'stop',
  ] as const;
  const text: Record<string, string> = {};
  for (const key of keys) {
    if (typeof o[key] === 'string') {
      text[key] = o[key] as string;
    }
  }
  return Object.keys(text).length > 0 ? text : undefined;
}

function pickHeader(raw: unknown): SdkHeaderConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const result: SdkHeaderConfig = {};

  const iconUrl = typeof o.iconUrl === 'string' ? o.iconUrl.trim() : undefined;
  if (iconUrl) result.iconUrl = iconUrl;
  if (typeof o.showIcon === 'boolean') result.showIcon = o.showIcon;

  return Object.keys(result).length > 0 ? result : undefined;
}

function pickLauncher(raw: unknown): SdkLauncherConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const result: SdkLauncherConfig = {};

  const iconUrl = typeof o.iconUrl === 'string' ? o.iconUrl : undefined;
  const ariaLabel = typeof o.ariaLabel === 'string' ? o.ariaLabel : undefined;
  const label = typeof o.label === 'string' ? o.label.trim() : undefined;

  if (iconUrl) result.iconUrl = iconUrl;
  if (ariaLabel) result.ariaLabel = ariaLabel;
  if (label) result.label = label;

  if (
    typeof o.placement === 'string' &&
    (LAUNCHER_PLACEMENTS as readonly string[]).includes(o.placement)
  ) {
    result.placement = o.placement as SdkLauncherPlacement;
  }

  if (
    typeof o.variant === 'string' &&
    (LAUNCHER_VARIANTS as readonly string[]).includes(o.variant)
  ) {
    result.variant = o.variant as SdkLauncherVariant;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function pickWidget(raw: unknown): SdkWidgetConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const result: SdkWidgetConfig = {};

  if (
    typeof o.position === 'string' &&
    (WIDGET_POSITIONS as readonly string[]).includes(o.position)
  ) {
    result.position = o.position as SdkWidgetPosition;
  }

  const offsetX = typeof o.offsetX === 'string' ? o.offsetX.trim() : undefined;
  const offsetY = typeof o.offsetY === 'string' ? o.offsetY.trim() : undefined;
  if (offsetX) result.offsetX = offsetX;
  if (offsetY) result.offsetY = offsetY;

  if (typeof o.zIndex === 'number' && Number.isInteger(o.zIndex) && o.zIndex >= 1) {
    result.zIndex = o.zIndex;
  }

  const hideWhenSelector =
    typeof o.hideWhenSelector === 'string' ? o.hideWhenSelector.trim() : undefined;
  if (hideWhenSelector) result.hideWhenSelector = hideWhenSelector;

  if (
    typeof o.panelLayout === 'string' &&
    (WIDGET_PANEL_LAYOUTS as readonly string[]).includes(o.panelLayout)
  ) {
    result.panelLayout = o.panelLayout as SdkWidgetPanelLayout;
  }

  const panelWidth =
    typeof o.panelWidth === 'string' ? o.panelWidth.trim() : undefined;
  const panelHeight =
    typeof o.panelHeight === 'string' ? o.panelHeight.trim() : undefined;
  if (panelWidth) result.panelWidth = panelWidth;
  if (panelHeight) result.panelHeight = panelHeight;

  return Object.keys(result).length > 0 ? result : undefined;
}

function pickInline(raw: unknown): SdkInlineConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const result: SdkInlineConfig = {};

  const maxWidth =
    typeof o.maxWidth === 'string' ? o.maxWidth.trim() : undefined;
  const height = typeof o.height === 'string' ? o.height.trim() : undefined;
  const minHeight =
    typeof o.minHeight === 'string' ? o.minHeight.trim() : undefined;
  if (maxWidth) result.maxWidth = maxWidth;
  if (height) result.height = height;
  if (minHeight) result.minHeight = minHeight;

  return Object.keys(result).length > 0 ? result : undefined;
}

function pickVoice(raw: unknown): SdkProjectConfigData['voice'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const result: NonNullable<SdkProjectConfigData['voice']> = {};

  if (typeof o.input === 'boolean') result.input = o.input;
  if (typeof o.output === 'boolean') result.output = o.output;
  if (o.inputMode === 'browser' || o.inputMode === 'server' || o.inputMode === 'auto') {
    result.inputMode = o.inputMode;
  }
  if (typeof o.autoSendOnFinalize === 'boolean') {
    result.autoSendOnFinalize = o.autoSendOnFinalize;
  }
  if (typeof o.language === 'string') result.language = o.language;

  return Object.keys(result).length > 0 ? result : undefined;
}

function pickStringRecord(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
