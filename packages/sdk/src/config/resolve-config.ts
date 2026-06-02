import type { ActocoreSdkConfig, ResolvedActocoreConfig } from './types';

export function resolveConfig(config: ActocoreSdkConfig): ResolvedActocoreConfig {
  return {
    api: {
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      apiVersion: config.apiVersion,
    },
    theme: {
      mode: config.theme?.mode ?? 'light',
      tokens: config.theme?.tokens,
      className: config.theme?.className,
    },
    security: {
      allowedActionNames: config.security?.allowedActionNames,
      enforceActionAllowlist:
        config.security?.enforceActionAllowlist ??
        (config.security?.allowedActionNames !== undefined &&
          config.security.allowedActionNames.length > 0),
      hostContext: config.security?.hostContext,
    },
    ui: {
      showSources: config.ui?.showSources ?? true,
      showIntentBadge: config.ui?.showIntentBadge ?? false,
      showActionsHint: config.ui?.showActionsHint ?? true,
      showActionPicker: config.ui?.showActionPicker ?? false,
      composerMinRows: config.ui?.composerMinRows ?? 1,
      composerMaxRows: config.ui?.composerMaxRows ?? 6,
      classNames: config.ui?.classNames,
      text: config.ui?.text,
      launcher: config.ui?.launcher,
    },
    i18n: {
      locale: config.i18n?.locale ?? 'en',
      translations: config.i18n?.translations,
    },
    voice: {
      input: config.voice?.input ?? false,
      output: config.voice?.output ?? false,
      inputMode: config.voice?.inputMode ?? 'auto',
      autoSendOnFinalize: config.voice?.autoSendOnFinalize ?? false,
      language: config.voice?.language,
    },
  };
}
