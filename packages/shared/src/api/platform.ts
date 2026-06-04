import { apiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { PlatformAccountListItemData } from '../types/studio';
import { BaseApi } from './helper';

export class StudioPlatformApi extends BaseApi {
  listAccounts(
    search?: string,
    limit?: number,
  ): Promise<ApiResponse<PlatformAccountListItemData[]>> {
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    if (limit != null) {
      params.set('limit', String(limit));
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<PlatformAccountListItemData[]>>(
        apiPath(`web/platform/accounts${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  getAccount(
    accountId: string,
  ): Promise<ApiResponse<PlatformAccountListItemData | null>> {
    return this.request(() =>
      this.client.get<ApiResponse<PlatformAccountListItemData | null>>(
        apiPath(`web/platform/accounts/${accountId}`),
      ),
    );
  }
}

export const platformApi = new StudioPlatformApi();
