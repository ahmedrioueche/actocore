/** Project configuration loaded at runtime (not sent on every SDK request body). */
export interface ProjectSettings {
  systemPrompt?: string;
  rules?: string[];
  tone?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

/** Resolved per SDK request after auth + project load. */
export interface RequestContextData {
  projectId: string;
  projectName: string;
  settings: ProjectSettings;
  apiKeyId: string;
}
