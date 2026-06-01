import axios, { AxiosInstance } from 'axios';
import { TokenManager } from '../api/token';
import { DEFAULT_API_VERSION, setApiVersion } from './api-version';

export interface ApiConfig {
  baseURL?: string;
  isDev?: boolean;
  timeout?: number;
  /** SDK / server: default Bearer API key (overrides localStorage when set). */
  apiKey?: string;
  /** API path prefix segment (default `v1`). */
  apiVersion?: string;
}

let configuredBaseURL: string | null = null;
let configuredApiKey: string | null = null;
let configuredTimeout = 10000;

export let IS_DEV = false;

/** Core API origin (versioned routes: `/{apiVersion}/...`). */
export const DEFAULT_BASE_URL = 'http://localhost:3000';

export { DEFAULT_API_VERSION, apiPath, getApiVersion, setApiVersion } from './api-version';

export const BASE_URL = (): string => configuredBaseURL ?? DEFAULT_BASE_URL;

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
  if (config.apiVersion !== undefined) {
    setApiVersion(config.apiVersion);
  }
  apiClientInstance = null;
};

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
      const token = configuredApiKey ?? TokenManager.getBearerToken();
      if (token && reqConfig.headers) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
      return reqConfig;
    });
  }

  return apiClientInstance;
};
