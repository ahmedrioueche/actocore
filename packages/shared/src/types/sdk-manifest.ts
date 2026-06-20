import type { SdkManifestActionEntry } from './app-page';

/** Unified capability discovery for SDK and external agents. */
export interface SdkManifestData {
  manifestVersion: '1.0';
  projectId: string;
  capabilities: {
    qa: boolean;
    actions: boolean;
  };
  pages?: import('./app-page').AppPageManifestEntry[];
  pageLinks?: import('./app-page').AppPageLinkManifestEntry[];
  actions?: SdkManifestActionEntry[];
}
