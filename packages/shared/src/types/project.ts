/** Project configuration loaded at runtime (not sent on every SDK request body). */
export interface ProjectSettings {
  systemPrompt?: string;
  rules?: string[];
  tone?: string;
}

export interface ProjectData {
  id: string;
  accountId: string;
  name: string;
  archived: boolean;
  archivedAt?: string;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ListProjectsQuery {
  limit?: number;
  /** When true, only archived; when false, only active; omit = active only */
  archived?: boolean;
  /** Case-insensitive substring match on project name */
  search?: string;
}

export interface ListProjectSessionsQuery {
  limit?: number;
  /** Filter by SDK external user id */
  externalUserId?: string;
}

/** Resolved per SDK request after auth + project load. */
export interface RequestContextData {
  projectId: string;
  projectName: string;
  settings: ProjectSettings;
  apiKeyId: string;
}
