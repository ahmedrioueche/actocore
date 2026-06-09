import type { i18n } from 'i18next';

/** Theme tokens map to `--ac-*` CSS variables (without the prefix). */
export type ActocoreThemeTokens = Record<string, string>;

export type ActocoreThemeMode = 'light' | 'dark' | 'system';

export interface ActocoreThemeConfig {
  mode?: ActocoreThemeMode;
  /** Overrides e.g. `{ 'color-primary': '#6366f1' }` → `--ac-color-primary` */
  tokens?: ActocoreThemeTokens;
  /** Extra class on the root `[data-actocore]` wrapper */
  className?: string;
}

/**
 * Security controls — host + future Studio dashboard can tighten policy.
 * When `allowedActionNames` is set, only listed actions invoke host handlers.
 */
export interface ActocoreSecurityConfig {
  allowedActionNames?: string[];
  /** Block handler execution when action is not allowlisted (default true if allowlist set). */
  enforceActionAllowlist?: boolean;
  /**
   * Optional host context forwarded to Core later (route, user id).
   * Not sent automatically until backend supports it.
   */
  hostContext?: Record<string, unknown>;
}

/**
 * Per-string copy overrides (host or future dashboard).
 * Takes precedence over bundled i18n for the mapped keys.
 */
export interface ActocoreUiTextOverrides {
  headerTitle?: string;
  headerSubtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Shown in empty state to explain action capabilities. */
  actionsHint?: string;
  placeholder?: string;
  send?: string;
  open?: string;
}

/** Launcher bubble branding — image URL or widget-level React node. */
export interface ActocoreLauncherConfig {
  iconUrl?: string;
  ariaLabel?: string;
}

export type ActocoreWidgetPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface ActocoreWidgetConfig {
  position?: ActocoreWidgetPosition;
  offsetX?: string;
  offsetY?: string;
  zIndex?: number;
  hideWhenSelector?: string;
}

/** Optional class names per UI region (host/dashboard overrides). */
export interface ActocoreUiClassNames {
  chat?: string;
  header?: string;
  headerIcon?: string;
  messageList?: string;
  userBubble?: string;
  assistantBubble?: string;
  composer?: string;
  composerField?: string;
  sendButton?: string;
  launcher?: string;
  panel?: string;
}

export type ActocoreVoiceInputMode = 'browser' | 'server' | 'auto';

/**
 * Voice input (STT) and output (read-aloud) for the chat widget.
 * Input uses Web Speech API when available, or server transcription when configured.
 */
export interface ActocoreVoiceConfig {
  /** Show microphone control in the composer (default false). */
  input?: boolean;
  /** Show listen button on assistant messages (default false). */
  output?: boolean;
  /**
   * `browser` — Web Speech API only.
   * `server` — record audio and POST to Core STT.
   * `auto` — browser when supported, else server when runtime exposes it.
   */
  inputMode?: ActocoreVoiceInputMode;
  /** Send the message when dictation finishes (default true). */
  autoSendOnFinalize?: boolean;
  /** BCP-47 hint for STT (e.g. `en`, `fr`). */
  language?: string;
}

/** UI feature flags — future dashboard will drive these. */
export interface ActocoreUiConfig {
  showSources?: boolean;
  showIntentBadge?: boolean;
  /** Show hint that the bot can run in-app actions (default true). */
  showActionsHint?: boolean;
  /**
   * Optional prompt shortcuts beside the composer (fills input only; default false).
   * Chat value is natural language → AI extracts params → user confirms in-app.
   */
  showActionPicker?: boolean;
  composerMinRows?: number;
  composerMaxRows?: number;
  classNames?: ActocoreUiClassNames;
  text?: ActocoreUiTextOverrides;
  launcher?: ActocoreLauncherConfig;
  widget?: ActocoreWidgetConfig;
}

export interface ActocoreI18nConfig {
  /** BCP-47 locale, e.g. `en`, `fr` */
  locale?: string;
  /** Deep-merge custom strings over bundled locales */
  translations?: Record<string, Record<string, unknown>>;
}

export interface ActocoreApiConfig {
  apiKey: string;
  baseURL?: string;
  apiVersion?: string;
}

export interface ActocoreSdkConfig extends ActocoreApiConfig {
  theme?: ActocoreThemeConfig;
  security?: ActocoreSecurityConfig;
  ui?: ActocoreUiConfig;
  voice?: ActocoreVoiceConfig;
  i18n?: ActocoreI18nConfig;
  /** Stable host user id — scopes persisted chat sessions per end user. */
  externalUserId?: string;
  /** Restore the last chat session from localStorage on mount (default true). */
  persistSession?: boolean;
  /** Stream assistant replies via SSE (default true). Falls back to JSON when disabled or unavailable. */
  streamResponses?: boolean;
}

export interface ResolvedActocoreConfig {
  api: Required<Pick<ActocoreApiConfig, 'apiKey'>> &
    Pick<ActocoreApiConfig, 'baseURL' | 'apiVersion'>;
  theme: Required<Pick<ActocoreThemeConfig, 'mode'>> &
    ActocoreThemeConfig;
  security: Required<Pick<ActocoreSecurityConfig, 'enforceActionAllowlist'>> &
    ActocoreSecurityConfig;
  ui: Required<
    Pick<
      ActocoreUiConfig,
      | 'showSources'
      | 'showIntentBadge'
      | 'showActionsHint'
      | 'showActionPicker'
      | 'composerMinRows'
      | 'composerMaxRows'
    >
  > &
    Pick<ActocoreUiConfig, 'classNames' | 'text' | 'launcher' | 'widget'>;
  i18n: Required<Pick<ActocoreI18nConfig, 'locale'>> & ActocoreI18nConfig;
  voice: Required<
    Pick<ActocoreVoiceConfig, 'input' | 'output' | 'inputMode' | 'autoSendOnFinalize'>
  > &
    Pick<ActocoreVoiceConfig, 'language'>;
  externalUserId?: string;
  persistSession: boolean;
  streamResponses: boolean;
}

export type ActocoreI18nInstance = i18n;
