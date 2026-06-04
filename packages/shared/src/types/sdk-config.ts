/**
 * Dashboard-driven SDK presentation config (Studio / web control plane).
 * Mirrors embeddable SDK provider options except apiKey/baseURL (host-only).
 */

export type SdkThemeMode = 'light' | 'dark' | 'system';

export type SdkVoiceInputMode = 'browser' | 'server' | 'auto';

export interface SdkConfigAuditEntryData {
  id: string;
  projectId: string;
  sdkConfigVersion: number;
  changedSections: string[];
  actor?: string;
  createdAt: string;
}

export interface SdkI18nConfig {
  locale?: string;
  translations?: Record<string, Record<string, unknown>>;
}

export interface SdkThemeConfig {
  mode?: SdkThemeMode;
  tokens?: Record<string, string>;
  className?: string;
}

export interface SdkSecurityConfig {
  allowedActionNames?: string[];
  enforceActionAllowlist?: boolean;
}

export interface SdkUiTextOverrides {
  headerTitle?: string;
  headerSubtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionsHint?: string;
  placeholder?: string;
  send?: string;
  open?: string;
}

export interface SdkLauncherConfig {
  iconUrl?: string;
  ariaLabel?: string;
}

export interface SdkUiConfig {
  showSources?: boolean;
  showIntentBadge?: boolean;
  showActionsHint?: boolean;
  showActionPicker?: boolean;
  composerMinRows?: number;
  composerMaxRows?: number;
  text?: SdkUiTextOverrides;
  launcher?: SdkLauncherConfig;
}

export interface SdkVoiceConfig {
  input?: boolean;
  output?: boolean;
  inputMode?: SdkVoiceInputMode;
  autoSendOnFinalize?: boolean;
  language?: string;
}

/** Persisted per project — returned by GET/PATCH web sdk-config. */
export interface SdkProjectConfigData {
  sdkConfigVersion: number;
  i18n?: SdkI18nConfig;
  theme?: SdkThemeConfig;
  security?: SdkSecurityConfig;
  ui?: SdkUiConfig;
  voice?: SdkVoiceConfig;
}

/** Subset exposed on GET /v1/sdk/runtime for the embeddable SDK. */
export type SdkRuntimeConfigData = SdkProjectConfigData;
