/** Returned once when a key is issued; `key` is never stored in plain text. */
export interface ApiKeyIssuedData {
  id: string;
  projectId: string;
  prefix: string;
  key: string;
  name?: string;
  createdAt: string;
}

export interface ApiKeyMetadata {
  id: string;
  projectId: string;
  prefix: string;
  name?: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}
