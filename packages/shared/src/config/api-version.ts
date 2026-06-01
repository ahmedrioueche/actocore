/** Default API version — keep in sync with backend `setGlobalPrefix`. */
export const DEFAULT_API_VERSION = 'v1';

let configuredVersion = DEFAULT_API_VERSION;

export function getApiVersion(): string {
  return configuredVersion;
}

export function setApiVersion(version: string): void {
  const normalized = version.trim().replace(/^\//, '').replace(/\/$/, '');
  if (!normalized) {
    throw new Error('API version cannot be empty');
  }
  configuredVersion = normalized;
}

/**
 * Build a versioned path for Core API calls.
 * @example apiPath('sdk/chat') → '/v1/sdk/chat'
 */
export function apiPath(path: string): string {
  const segment = path.replace(/^\//, '');
  return `/${getApiVersion()}/${segment}`;
}
