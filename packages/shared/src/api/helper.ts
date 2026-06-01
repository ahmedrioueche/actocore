import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getApiClient } from '../config/api';
import { ApiResponse } from '../types/api-response';
import { ErrorCode, HttpStatusToErrorCode } from '../types/error';

export const apiClient = new Proxy({} as AxiosInstance, {
  get: (_, prop) => {
    const client = getApiClient();
    const value = client[prop as keyof AxiosInstance];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function apiResponse<T>(
  success: boolean,
  errorCode?: string,
  data?: T,
  message?: string,
): ApiResponse<T> {
  return { success, errorCode, data, message };
}

function errorBody(error: unknown): ApiResponse<unknown> | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }
  const body = error.response?.data;
  if (body && typeof body === 'object' && 'success' in body) {
    return body as ApiResponse<unknown>;
  }
  return undefined;
}

export function handleApiError(error: unknown): ApiResponse<null> {
  const body = errorBody(error);

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const errorCode =
      body?.errorCode ??
      HttpStatusToErrorCode[status] ??
      ErrorCode.INTERNAL_ERROR;
    const message =
      body?.message ?? error.message ?? 'Unexpected server error';

    return apiResponse<null>(false, errorCode, null, message);
  }

  return apiResponse<null>(
    false,
    ErrorCode.INTERNAL_ERROR,
    null,
    'Unexpected error',
  );
}

/** Runs an HTTP call and normalizes success / axios errors into ApiResponse. */
export async function apiRequest<T>(
  call: () => Promise<AxiosResponse<ApiResponse<T>>>,
): Promise<ApiResponse<T>> {
  try {
    const { data } = await call();
    return data;
  } catch (error) {
    return handleApiError(error) as ApiResponse<T>;
  }
}

export abstract class BaseApi {
  constructor(protected readonly client: AxiosInstance = apiClient) {}

  protected request<T>(
    call: () => Promise<AxiosResponse<ApiResponse<T>>>,
  ): Promise<ApiResponse<T>> {
    return apiRequest(call);
  }
}
