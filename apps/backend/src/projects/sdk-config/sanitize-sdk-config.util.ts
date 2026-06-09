import type {
  SdkLauncherConfig,
  SdkProjectConfigData,
  SdkUiTextOverrides,
  SdkWidgetConfig,
  SdkWidgetPosition,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

const WIDGET_POSITIONS: readonly SdkWidgetPosition[] = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

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
  return {
    sdkConfigVersion: current.sdkConfigVersion,
    i18n: patch.i18n !== undefined ? mergeSection(current.i18n, patch.i18n) : current.i18n,
    theme:
      patch.theme !== undefined ? mergeSection(current.theme, patch.theme) : current.theme,
    security:
      patch.security !== undefined
        ? mergeSection(current.security, patch.security)
        : current.security,
    ui: patch.ui !== undefined ? mergeSection(current.ui, patch.ui) : current.ui,
    voice:
      patch.voice !== undefined ? mergeSection(current.voice, patch.voice) : current.voice,
  };
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

  const launcher = pickLauncher(o.launcher);
  if (launcher) result.launcher = launcher;

  const widget = pickWidget(o.widget);
  if (widget) result.widget = widget;

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
  ] as const;
  const text: Record<string, string> = {};
  for (const key of keys) {
    if (typeof o[key] === 'string') {
      text[key] = o[key] as string;
    }
  }
  return Object.keys(text).length > 0 ? text : undefined;
}

function pickLauncher(raw: unknown): SdkLauncherConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const iconUrl = typeof o.iconUrl === 'string' ? o.iconUrl : undefined;
  const ariaLabel = typeof o.ariaLabel === 'string' ? o.ariaLabel : undefined;
  if (!iconUrl && !ariaLabel) return undefined;
  return { iconUrl, ariaLabel };
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
