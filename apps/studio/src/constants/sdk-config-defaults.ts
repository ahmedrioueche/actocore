import type {
  SdkLauncherPlacement,
  SdkLauncherVariant,
  SdkLoadingInitStyle,
  SdkLoadingTextAnimation,
  SdkLoadingThinkingStyle,
  SdkPresentationMode,
  SdkWidgetPanelLayout,
  SdkWidgetPosition,
} from '@ahmedrioueche/actocore-shared';

export { SDK_CONFIG_APP_THEMES_DEFAULT } from '@/constants/sdk-app-themes';

/** Built-in SDK copy defaults — keep in sync with packages/sdk/src/i18n/locales/en.json */
export const SDK_CONFIG_UI_TEXT_DEFAULTS = {
  headerTitle: 'Assistant',
  headerSubtitle: 'Ask questions or run actions in your app.',
  emptyTitle: '',
  emptyDescription: 'Ask a question or describe what you want.',
  actionsHint:
    'Ask in plain language — the assistant prepares actions and you confirm once; your app runs the real UI.',
  placeholder: 'Type a message…',
  send: 'Send',
  open: 'Open chat',
  newConversation: 'New conversation',
  minimize: 'Minimize chat',
  stop: 'Stop generating',
  loading: 'Loading conversation…',
  thinking: 'Thinking…',
  launcherAriaLabel: 'Open chat',
} as const;

export const SDK_CONFIG_LOADING_DEFAULTS = {
  initStyle: 'bar-and-centered' as SdkLoadingInitStyle,
  thinkingStyle: 'text' as SdkLoadingThinkingStyle,
  thinkingAnimation: 'ellipsis' as SdkLoadingTextAnimation,
} as const;

export const SDK_CONFIG_HEADER_DEFAULTS = {
  showIcon: true,
} as const;

export const SDK_CONFIG_UI_TOGGLE_DEFAULTS = {
  showSources: true,
  showIntentBadge: false,
  showActionsHint: false,
  showActionPicker: false,
} as const;

export const SDK_CONFIG_COMPOSER_DEFAULTS = {
  composerMinRows: 1,
  composerMaxRows: 6,
} as const;

export const SDK_CONFIG_LAUNCHER_DEFAULTS = {
  placement: 'floating' as const,
  variant: 'icon' as const,
  label: '',
} as const;

export const SDK_CONFIG_WIDGET_DEFAULTS = {
  position: 'bottom-right' as SdkWidgetPosition,
  offsetX: '1.25rem',
  offsetY: '1.25rem',
  panelLayout: 'overlay' as SdkWidgetPanelLayout,
  panelWidth: '24rem',
  panelHeight: '',
} as const;

export const SDK_CONFIG_PRESENTATION_DEFAULT: SdkPresentationMode = 'widget';

export const SDK_CONFIG_INLINE_DEFAULTS = {
  maxWidth: '24rem',
  height: '100%',
  minHeight: '24rem',
} as const;
