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
  /** Allow every action belonging to these section ids (union with allowedActionNames). */
  allowedSectionIds?: string[];
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
  newConversation?: string;
  minimize?: string;
  stop?: string;
}

export const SDK_WIDGET_POSITIONS = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
] as const;

export type SdkWidgetPosition = (typeof SDK_WIDGET_POSITIONS)[number];

export const SDK_PRESENTATION_MODES = ['widget', 'inline'] as const;
export type SdkPresentationMode = (typeof SDK_PRESENTATION_MODES)[number];

export const SDK_WIDGET_PANEL_LAYOUTS = [
  'overlay',
  'dock-right',
  'dock-left',
] as const;
export type SdkWidgetPanelLayout = (typeof SDK_WIDGET_PANEL_LAYOUTS)[number];

export const SDK_LAUNCHER_PLACEMENTS = ['floating', 'host'] as const;
export type SdkLauncherPlacement = (typeof SDK_LAUNCHER_PLACEMENTS)[number];

export const SDK_LAUNCHER_VARIANTS = ['icon', 'button', 'link'] as const;
export type SdkLauncherVariant = (typeof SDK_LAUNCHER_VARIANTS)[number];

export interface SdkLauncherConfig {
  iconUrl?: string;
  ariaLabel?: string;
  /** Floating corner bubble (default) vs host-mounted trigger in navbar/layout. */
  placement?: SdkLauncherPlacement;
  /** Visual style when mounted by the host or shown as floating trigger. */
  variant?: SdkLauncherVariant;
  /** Visible label for button/link variants. */
  label?: string;
}

export interface SdkWidgetConfig {
  position?: SdkWidgetPosition;
  /** CSS length from the screen edge, e.g. `1.25rem` or `20px`. */
  offsetX?: string;
  offsetY?: string;
  /** Stacking order for launcher and open chat. Default `1000`. Set below host modals if needed. */
  zIndex?: number;
  /**
   * Hide the widget while this CSS selector matches any element (e.g. `[data-modal-open]` on body).
   * Host apps toggle the marker when overlays open.
   */
  hideWhenSelector?: string;
  /** Floating card vs Seer-like side drawer (widget mode only). Default `overlay`. */
  panelLayout?: SdkWidgetPanelLayout;
  /** Maps to `--ac-chat-max-width`, e.g. `24rem` or `420px`. */
  panelWidth?: string;
  /** Maps to `--ac-widget-panel-height`. */
  panelHeight?: string;
}

export interface SdkInlineConfig {
  /** For hosts rendering `ActoChat` inside their layout. */
  maxWidth?: string;
  height?: string;
  minHeight?: string;
}

export interface SdkUiConfig {
  presentation?: SdkPresentationMode;
  showSources?: boolean;
  showIntentBadge?: boolean;
  showActionsHint?: boolean;
  showActionPicker?: boolean;
  composerMinRows?: number;
  composerMaxRows?: number;
  text?: SdkUiTextOverrides;
  launcher?: SdkLauncherConfig;
  widget?: SdkWidgetConfig;
  inline?: SdkInlineConfig;
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
