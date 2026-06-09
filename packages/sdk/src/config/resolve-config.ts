import type { ActocoreSdkConfig, ResolvedActocoreConfig } from './types';
import { SDK_VOICE_DEFAULTS } from './sdk-defaults';

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
      showActionsHint: config.ui?.showActionsHint ?? false,
      showActionPicker: config.ui?.showActionPicker ?? false,
      composerMinRows: config.ui?.composerMinRows ?? 1,
      composerMaxRows: config.ui?.composerMaxRows ?? 6,
      classNames: config.ui?.classNames,
      text: config.ui?.text,
      launcher: config.ui?.launcher,
      widget: config.ui?.widget,
    },
    i18n: {
      locale: config.i18n?.locale ?? 'en',
      translations: config.i18n?.translations,
    },
    voice: {
      input: config.voice?.input ?? SDK_VOICE_DEFAULTS.input,
      output: config.voice?.output ?? SDK_VOICE_DEFAULTS.output,
      inputMode: config.voice?.inputMode ?? SDK_VOICE_DEFAULTS.inputMode,
      autoSendOnFinalize:
        config.voice?.autoSendOnFinalize ?? SDK_VOICE_DEFAULTS.autoSendOnFinalize,
      language: config.voice?.language,
    },
    externalUserId: config.externalUserId,
    persistSession: config.persistSession ?? true,
  };
}
