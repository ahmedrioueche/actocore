import axios, { AxiosInstance } from 'axios';
import { TokenManager } from '../api/token';
import { DEFAULT_API_VERSION, setApiVersion, setSdkRoutePrefix } from './api-version';

export interface ApiConfig {
  baseURL?: string;
  isDev?: boolean;
  timeout?: number;
  /** SDK / server: default Bearer API key (overrides localStorage when set). */
  apiKey?: string;
  /** Studio dashboard JWT (overrides stored access token when set). */
  studioAccessToken?: string;
  /** API path prefix segment (default `v1`). */
  apiVersion?: string;
  /** SDK route prefix after version (default `sdk`, marketing uses `marketing/sdk`). */
  sdkRoutePrefix?: string;
}

let configuredBaseURL: string | null = null;
let configuredApiKey: string | null = null;
let configuredStudioAccessToken: string | null = null;
let configuredTimeout = 10000;

export let IS_DEV = false;

/** Local Core origin for development. */
export const ACTOCORE_DEVELOPMENT_API_URL = 'http://localhost:3000';

/** Hosted ActoCore API origin for production builds. */
export const ACTOCORE_PRODUCTION_API_URL = 'https://api.actocore.pro';

/** @deprecated Use {@link resolveActocoreBaseURL} */
export const DEFAULT_BASE_URL = ACTOCORE_DEVELOPMENT_API_URL;

export { DEFAULT_API_VERSION, apiPath, getApiVersion, getSdkRoutePrefix, sdkApiPath, setApiVersion, setSdkRoutePrefix } from './api-version';

export function isActocoreDevelopmentEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function resolveActocoreBaseURL(override?: string): string {
  const trimmed = override?.trim().replace(/\/$/, '');
  if (trimmed) return trimmed;
  return isActocoreDevelopmentEnvironment()
    ? ACTOCORE_DEVELOPMENT_API_URL
    : ACTOCORE_PRODUCTION_API_URL;
}

export const BASE_URL = (): string =>
  configuredBaseURL ?? resolveActocoreBaseURL();

export const getApiBaseUrl = (): string => BASE_URL();

export const getAuthToken = (): string | null => TokenManager.getBearerToken();

let apiClientInstance: AxiosInstance | null = null;

export const configureApi = (config: ApiConfig): void => {
  if (config.baseURL !== undefined) {
    configuredBaseURL = config.baseURL.replace(/\/$/, '');
  }
  if (config.isDev !== undefined) {
    IS_DEV = config.isDev;
  }
  if (config.timeout !== undefined) {
    configuredTimeout = config.timeout;
  }
  if (config.apiKey !== undefined) {
    configuredApiKey = config.apiKey;
  }
  if (config.studioAccessToken !== undefined) {
    configuredStudioAccessToken = config.studioAccessToken;
  }
  if (config.apiVersion !== undefined) {
    setApiVersion(config.apiVersion);
  }
  if (config.sdkRoutePrefix !== undefined) {
    setSdkRoutePrefix(config.sdkRoutePrefix);
  }
  apiClientInstance = null;
};

/** Bearer token for SDK routes (`/sdk/*`) — configured API key wins over stored tokens. */
export const getSdkAuthToken = (): string | null =>
  configuredApiKey || TokenManager.getAccessToken();

/** SDK routes use the embed API key; Studio web routes use the session JWT. */
function resolveRequestAuthToken(requestUrl: string): string | null {
  const path = requestUrl.includes('://')
    ? new URL(requestUrl, BASE_URL()).pathname
    : requestUrl;
  const isSdkRoute =
    path.includes('/sdk/') || path.includes('/marketing/sdk/');

  if (isSdkRoute) {
    return getSdkAuthToken();
  }

  return (
    configuredStudioAccessToken ||
    TokenManager.getAccessToken() ||
    configuredApiKey
  );
}

export const getApiClient = (): AxiosInstance => {
  if (!apiClientInstance) {
    apiClientInstance = axios.create({
      baseURL: BASE_URL(),
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: configuredTimeout,
    });

    apiClientInstance.interceptors.request.use((reqConfig) => {
      const token = resolveRequestAuthToken(reqConfig.url ?? '');
      if (token && reqConfig.headers) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
      return reqConfig;
    });
  }

  return apiClientInstance;
};
