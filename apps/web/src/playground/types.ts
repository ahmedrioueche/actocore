export const PLAYGROUND_VIEWS = [
  'app-layout',
  'knowledge',
  'actions',
  'sdk-config',
] as const;

export type PlaygroundView = (typeof PLAYGROUND_VIEWS)[number];

export type PlaygroundUploadedDocument = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  content: string;
};

export type PlaygroundManifestPage = {
  id: string;
  title: string;
  route: string;
  description?: string;
};

export type PlaygroundAppPage = {
  backendId?: string;
  id: string;
  title: string;
  route: string;
  description?: string;
};

export type PlaygroundActionDefinition = {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type PlaygroundSdkExtras = {
  enforceActionAllowlist: boolean;
  voiceInput: boolean;
  voiceOutput: boolean;
  allowedActionNames: string[];
};

export type PlaygroundState = {
  appPages: PlaygroundAppPage[];
  actions: PlaygroundActionDefinition[];
  sdk: PlaygroundSdkExtras;
};
