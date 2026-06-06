import type { SdkThemeMode } from '@ahmedrioueche/actocore-shared';

/** Built-in SDK copy defaults — keep in sync with packages/sdk/src/i18n/locales/en.json */
export const SDK_CONFIG_UI_TEXT_DEFAULTS = {
  headerTitle: 'Assistant',
  headerSubtitle: 'Ask questions or run actions in your app.',
  emptyTitle: 'Start a conversation',
  emptyDescription: 'Ask a question or describe what you want to do.',
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
  showActionsHint: true,
  showActionPicker: false,
} as const;

export const SDK_CONFIG_COMPOSER_DEFAULTS = {
  composerMinRows: 1,
  composerMaxRows: 6,
} as const;

export const SDK_CONFIG_THEME_MODE_DEFAULT: SdkThemeMode = 'light';
