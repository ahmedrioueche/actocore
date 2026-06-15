/** Default API version — keep in sync with backend `setGlobalPrefix`. */
export const DEFAULT_API_VERSION = 'v1';

let configuredVersion = DEFAULT_API_VERSION;
let configuredSdkRoutePrefix = 'sdk';

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

export function getSdkRoutePrefix(): string {
  return configuredSdkRoutePrefix;
}

export function setSdkRoutePrefix(prefix: string): void {
  const normalized = prefix.trim().replace(/^\//, '').replace(/\/$/, '');
  if (!normalized) {
    throw new Error('SDK route prefix cannot be empty');
  }
  configuredSdkRoutePrefix = normalized;
}

/**
 * Build a versioned path for Core API calls.
 * @example apiPath('web/projects') → '/v1/web/projects'
 */
export function apiPath(path: string): string {
  const segment = path.replace(/^\//, '');
  return `/${getApiVersion()}/${segment}`;
}

/**
 * Build a versioned path for SDK / marketing SDK API calls.
 * @example sdkApiPath('chat') → '/v1/sdk/chat'
 * @example sdkApiPath('chat') with prefix `marketing/sdk` → '/v1/marketing/sdk/chat'
 */
export function sdkApiPath(path: string): string {
  const segment = path.replace(/^\//, '');
  return `/${getApiVersion()}/${getSdkRoutePrefix()}/${segment}`;
}
