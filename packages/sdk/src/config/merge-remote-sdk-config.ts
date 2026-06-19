import type { SdkRuntimeConfigData } from '@ahmedrioueche/actocore-shared';
import type { ActocoreSdkConfig } from './types';

/**
 * Merge order: host props (local) override dashboard defaults from Core runtime.
 */
export function mergeRemoteSdkConfig(
  local: ActocoreSdkConfig,
  remote?: SdkRuntimeConfigData | null,
): ActocoreSdkConfig {
  if (!remote) {
    return local;
  }

  return {
    ...local,
    i18n: {
      locale: local.i18n?.locale ?? remote.i18n?.locale,
      translations: {
        ...(remote.i18n?.translations ?? {}),
        ...(local.i18n?.translations ?? {}),
      },
    },
    theme: {
      mode: local.theme?.mode ?? remote.theme?.mode,
      className: local.theme?.className ?? remote.theme?.className,
      tokens: {
        ...(remote.theme?.tokens ?? {}),
        ...(local.theme?.tokens ?? {}),
      },
    },
    security: {
      enforceActionAllowlist:
        local.security?.enforceActionAllowlist ??
        remote.security?.enforceActionAllowlist,
      allowedActionNames:
        local.security?.allowedActionNames ?? remote.security?.allowedActionNames,
    },
    ui: mergeUi(local.ui, remote.ui),
    voice: {
      input: local.voice?.input ?? remote.voice?.input,
      output: local.voice?.output ?? remote.voice?.output,
      inputMode: local.voice?.inputMode ?? remote.voice?.inputMode,
      autoSendOnFinalize:
        local.voice?.autoSendOnFinalize ?? remote.voice?.autoSendOnFinalize,
      language: local.voice?.language ?? remote.voice?.language,
    },
  };
}

function mergeUi(
  local: ActocoreSdkConfig['ui'],
  remote: SdkRuntimeConfigData['ui'],
): ActocoreSdkConfig['ui'] {
  if (!local && !remote) return undefined;
  return {
    showSources: local?.showSources ?? remote?.showSources,
    showIntentBadge: local?.showIntentBadge ?? remote?.showIntentBadge,
    showActionsHint: local?.showActionsHint ?? remote?.showActionsHint,
    showActionPicker: local?.showActionPicker ?? remote?.showActionPicker,
    composerMinRows: local?.composerMinRows ?? remote?.composerMinRows,
    composerMaxRows: local?.composerMaxRows ?? remote?.composerMaxRows,
    seedMessages: local?.seedMessages,
    text: {
      ...(remote?.text ?? {}),
      ...(local?.text ?? {}),
    },
    header: {
      ...(remote?.header ?? {}),
      ...(local?.header ?? {}),
    },
    launcher: {
      ...(remote?.launcher ?? {}),
      ...(local?.launcher ?? {}),
    },
    widget: {
      ...(remote?.widget ?? {}),
      ...(local?.widget ?? {}),
    },
    inline: {
      ...(remote?.inline ?? {}),
      ...(local?.inline ?? {}),
    },
    presentation: local?.presentation ?? remote?.presentation,
    classNames: local?.classNames,
  };
}
