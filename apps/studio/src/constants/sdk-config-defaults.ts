import type { SdkWidgetPosition } from '@ahmedrioueche/actocore-shared';

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
  launcherAriaLabel: 'Open chat',
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

export const SDK_CONFIG_WIDGET_DEFAULTS = {
  position: 'bottom-right' as SdkWidgetPosition,
  offsetX: '1.25rem',
  offsetY: '1.25rem',
} as const;
