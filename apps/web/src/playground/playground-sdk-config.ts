import type {
  SdkProjectConfigData,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';

import {
  configToFormState,
  createDefaultSdkConfigFormState,
  formStateToPatch,
  type SdkConfigFormState,
} from '@/utils/sdk-config-form';

import type { PlaygroundSdkExtras } from './types';

export type PlaygroundSdkConfig = {
  form: SdkConfigFormState;
  extras: PlaygroundSdkExtras;
};

export function createDefaultPlaygroundSdkConfig(): PlaygroundSdkConfig {
  return {
    form: createDefaultSdkConfigFormState(),
    extras: {
      enforceActionAllowlist: true,
      voiceInput: false,
      voiceOutput: false,
      allowedActionNames: [],
    },
  };
}

export function sdkProjectConfigToPlayground(
  config: SdkProjectConfigData | null | undefined,
): PlaygroundSdkConfig {
  if (!config) {
    return createDefaultPlaygroundSdkConfig();
  }

  return {
    form: configToFormState(config),
    extras: {
      enforceActionAllowlist: config.security?.enforceActionAllowlist ?? true,
      voiceInput: config.voice?.input ?? false,
      voiceOutput: config.voice?.output ?? false,
      allowedActionNames: config.security?.allowedActionNames ?? [],
    },
  };
}

export function playgroundSdkToPatch(
  state: PlaygroundSdkConfig,
): UpdateSdkProjectConfigDto {
  return {
    ...formStateToPatch(state.form),
    security: {
      allowedActionNames: state.extras.allowedActionNames,
      enforceActionAllowlist: state.extras.enforceActionAllowlist,
    },
    voice: {
      input: state.extras.voiceInput,
      output: state.extras.voiceOutput,
    },
  };
}
