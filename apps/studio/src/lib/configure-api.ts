import {
  configureApi,
  getApiClient,
  studioAuthApi,
  TokenManager,
} from '@ahmedrioueche/actocore-shared';

import {
  forceLogout,
  isLogoutInProgress,
} from '@/lib/auth-session';

type Axios401Error = {
  response?: { status?: number };
  config?: {
    url?: string;
    headers?: Record<string, string>;
    _studioRetried?: boolean;
  };
};

function asAxios401Error(error: unknown): Axios401Error | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as Axios401Error).response?.status === 401
  ) {
    return error as Axios401Error;
  }
  return null;
}

let configured = false;
let interceptorAttached = false;

function attachUnauthorizedInterceptor(): void {
  if (interceptorAttached) {
    return;
  }
  interceptorAttached = true;

  const client = getApiClient();

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const axiosError = asAxios401Error(error);
      if (!axiosError) {
        return Promise.reject(error);
      }

      const requestUrl = axiosError.config?.url ?? '';
      if (
        requestUrl.includes('/web/auth/refresh') ||
        requestUrl.includes('/web/auth/logout') ||
        requestUrl.includes('/web/auth/login')
      ) {
        if (!isLogoutInProgress()) {
          await forceLogout();
        }
        return Promise.reject(error);
      }

      const originalRequest = axiosError.config;
      if (!originalRequest || originalRequest._studioRetried) {
        if (!isLogoutInProgress()) {
          await forceLogout();
        }
        return Promise.reject(error);
      }

      originalRequest._studioRetried = true;

      if (!TokenManager.getRefreshToken()) {
        if (!isLogoutInProgress()) {
          await forceLogout();
        }
        return Promise.reject(error);
      }

      const refreshed = await studioAuthApi.refresh();
      if (refreshed.success && refreshed.data?.accessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
        return client.request(originalRequest);
      }

      if (!isLogoutInProgress()) {
        await forceLogout();
      }
      return Promise.reject(error);
    },
  );
}

export function ensureApiConfigured(): void {
  if (configured) {
    return;
  }
  const baseURL =
    import.meta.env.VITE_ACTOCORE_API_URL?.replace(/\/$/, '') ||
    'http://localhost:3000';
  configureApi({
    baseURL,
    isDev: import.meta.env.DEV,
  });
  attachUnauthorizedInterceptor();
  configured = true;
}
