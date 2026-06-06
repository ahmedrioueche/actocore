import { apiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { Paginated, PaginationQuery } from '../types/pagination';
import type { PlatformAccountListItemData } from '../types/studio';
import { BaseApi } from './helper';

export class StudioPlatformApi extends BaseApi {
  listAccounts(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<PlatformAccountListItemData>>> {
    const params = new URLSearchParams();
    if (options.search?.trim()) {
      params.set('search', options.search.trim());
    }
    if (options.page != null) {
      params.set('page', String(options.page));
    }
    if (options.limit != null) {
      params.set('limit', String(options.limit));
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<PlatformAccountListItemData>>>(
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
