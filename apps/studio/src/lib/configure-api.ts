import {
  configureApi,
  getApiClient,
  platformAuthApi,
  studioAuthApi,
  TokenManager,
} from '@ahmedrioueche/actocore-shared';

import {
  forceLogout,
  isLogoutInProgress,
  resolveLoginRedirect,
} from '@/lib/auth-session';
import { isAdminPath, signOutPlatform } from '@/lib/platform-session';

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

function isPlatformApiUrl(url: string): boolean {
  return url.includes('/web/platform/') || url.includes('/web/admin/');
}

function isAuthPublicUrl(url: string): boolean {
  return (
    url.includes('/web/auth/login') ||
    url.includes('/web/auth/refresh') ||
    url.includes('/web/auth/logout') ||
    url.includes('/web/platform/auth/login') ||
    url.includes('/web/platform/auth/refresh')
  );
}

let configured = false;
let interceptorAttached = false;

async function handleUnauthorizedForUrl(requestUrl: string): Promise<void> {
  if (isLogoutInProgress()) {
    return;
  }

  if (isPlatformApiUrl(requestUrl) || isAdminPath(window.location.pathname)) {
    await signOutPlatform();
    return;
  }

  await forceLogout(resolveLoginRedirect());
}

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
      if (isAuthPublicUrl(requestUrl)) {
        await handleUnauthorizedForUrl(requestUrl);
        return Promise.reject(error);
      }

      const originalRequest = axiosError.config;
      if (!originalRequest || originalRequest._studioRetried) {
        await handleUnauthorizedForUrl(requestUrl);
        return Promise.reject(error);
      }

      originalRequest._studioRetried = true;

      if (!TokenManager.getRefreshToken()) {
        await handleUnauthorizedForUrl(requestUrl);
        return Promise.reject(error);
      }

      const usePlatformRefresh =
        isPlatformApiUrl(requestUrl) || isAdminPath(window.location.pathname);
      const refreshed = usePlatformRefresh
        ? await platformAuthApi.refresh()
        : await studioAuthApi.refresh();

      if (refreshed.success && refreshed.data?.accessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
        return client.request(originalRequest);
      }

      await handleUnauthorizedForUrl(requestUrl);
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
