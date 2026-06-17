import type { AppPageManifestEntry } from './app-page';
import type { SdkRuntimeConfigData } from './sdk-config';
import type { RuntimeVoiceConfig } from './voice';

export interface RuntimeConfigData {
  apiVersion: string;
  features: string[];
  /** Project bound to the authenticated SDK API key. */
  projectId: string;
  voice?: RuntimeVoiceConfig;
  /** Dashboard-driven SDK presentation config (merge under host props). */
  sdk?: SdkRuntimeConfigData;
  /** Enabled app pages for host route mapping and AI context. */
  pages?: AppPageManifestEntry[];
  /**
   * Opaque fingerprint — changes when sdk config, app layout, actions, or
   * knowledge change. Embed polls this to refresh without a full page reload.
   */
  dataRevision?: string;
}
