import { apiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type {
  PlatformAnalyticsOverview,
  PlatformProjectListItem,
  PlatformSubscriptionListItem,
  PlatformUserListItem,
} from '../types/platform';
import type { Paginated, PaginationQuery } from '../types/pagination';
import type { StudioBillingHistoryEntry, StudioSubscription } from '../types/billing';
import type { PlatformAccountListItemData } from '../types/studio';
import type { PlatformReportListItem } from '../types/report';
import type { UpdateStudioReportStatusDto } from '../dtos/report.dto';
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

  listSubscriptions(
    options: {
      search?: string;
      status?: string;
    } & PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<PlatformSubscriptionListItem>>> {
    const params = new URLSearchParams();
    if (options.search?.trim()) params.set('search', options.search.trim());
    if (options.status?.trim()) params.set('status', options.status.trim());
    if (options.page != null) params.set('page', String(options.page));
    if (options.limit != null) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<PlatformSubscriptionListItem>>>(
        apiPath(`web/platform/subscriptions${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  getAccountSubscription(
    accountId: string,
  ): Promise<
    ApiResponse<{
      subscription: StudioSubscription | null;
      payments: StudioBillingHistoryEntry[];
    } | null>
  > {
    return this.request(() =>
      this.client.get<
        ApiResponse<{
          subscription: StudioSubscription | null;
          payments: StudioBillingHistoryEntry[];
        } | null>
      >(apiPath(`web/platform/accounts/${accountId}/subscription`)),
    );
  }

  listUsers(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<PlatformUserListItem>>> {
    const params = new URLSearchParams();
    if (options.search?.trim()) params.set('search', options.search.trim());
    if (options.page != null) params.set('page', String(options.page));
    if (options.limit != null) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<PlatformUserListItem>>>(
        apiPath(`web/platform/users${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  listProjects(
    options: { search?: string } & PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<PlatformProjectListItem>>> {
    const params = new URLSearchParams();
    if (options.search?.trim()) params.set('search', options.search.trim());
    if (options.page != null) params.set('page', String(options.page));
    if (options.limit != null) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<PlatformProjectListItem>>>(
        apiPath(`web/platform/projects${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  getAnalyticsOverview(): Promise<ApiResponse<PlatformAnalyticsOverview>> {
    return this.request(() =>
      this.client.get<ApiResponse<PlatformAnalyticsOverview>>(
        apiPath('web/platform/analytics/overview'),
      ),
    );
  }

  listReports(
    options: {
      search?: string;
      status?: string;
      type?: string;
    } & PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<PlatformReportListItem>>> {
    const params = new URLSearchParams();
    if (options.search?.trim()) params.set('search', options.search.trim());
    if (options.status?.trim()) params.set('status', options.status.trim());
    if (options.type?.trim()) params.set('type', options.type.trim());
    if (options.page != null) params.set('page', String(options.page));
    if (options.limit != null) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<PlatformReportListItem>>>(
        apiPath(`web/platform/reports${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  getReport(reportId: string): Promise<ApiResponse<PlatformReportListItem>> {
    return this.request(() =>
      this.client.get<ApiResponse<PlatformReportListItem>>(
        apiPath(`web/platform/reports/${reportId}`),
      ),
    );
  }

  updateReportStatus(
    reportId: string,
    body: UpdateStudioReportStatusDto,
  ): Promise<ApiResponse<PlatformReportListItem>> {
    return this.request(() =>
      this.client.patch<ApiResponse<PlatformReportListItem>>(
        apiPath(`web/platform/reports/${reportId}`),
        body,
      ),
    );
  }
}

export const platformApi = new StudioPlatformApi();
