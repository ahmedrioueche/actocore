import type { RuntimeVoiceConfig } from './voice';

export interface RuntimeConfigData {
  apiVersion: string;
  features: string[];
  /** Project bound to the authenticated SDK API key. */
  projectId: string;
  voice?: RuntimeVoiceConfig;
}
