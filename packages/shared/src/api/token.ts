const ACCESS_TOKEN_KEY = 'actocore_access_token';
const REFRESH_TOKEN_KEY = 'actocore_refresh_token';
const API_KEY_KEY = 'actocore_api_key';

export const TokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getApiKey: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(API_KEY_KEY);
  },

  /** API key (SDK) or access token (dashboard), for Authorization header. */
  getBearerToken: (): string | null => {
    return TokenManager.getApiKey() ?? TokenManager.getAccessToken();
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  setAccessToken: (accessToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  setApiKey: (apiKey: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_KEY_KEY, apiKey);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(API_KEY_KEY);
  },
};
