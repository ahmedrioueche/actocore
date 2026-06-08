import { apiPath } from '../config/api-version';
import type {
  UsageEventsQueryDto,
  UsageExportQueryDto,
  UsageRangeQueryDto,
  UsageSeriesQueryDto,
} from '../dtos/usage.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  AccountUsageSummaryData,
  PlatformUsageOverviewData,
  ProjectKnowledgeUsageData,
  ProjectSessionUsageData,
  ProjectUsageBreakdownData,
  UsageEventsPageData,
  UsageSummaryData,
  UsageTimeSeriesData,
} from '../types/usage';
import { BaseApi } from './helper';

/** Platform operator only — requires platform analytics permission. */
export class PlatformUsageAdminApi extends BaseApi {
  getOverview(
    query?: UsageRangeQueryDto,
  ): Promise<ApiResponse<PlatformUsageOverviewData>> {
    return this.request(() =>
      this.client.get<ApiResponse<PlatformUsageOverviewData>>(
        apiPath('web/admin/usage/overview'),
        { params: query },
      ),
    );
  }

  getAccountSummary(
    accountId: string,
    query?: UsageRangeQueryDto,
  ): Promise<ApiResponse<AccountUsageSummaryData>> {
    return this.request(() =>
      this.client.get<ApiResponse<AccountUsageSummaryData>>(
        apiPath(`web/admin/usage/accounts/${accountId}`),
        { params: query },
      ),
    );
  }

  getProjectBreakdown(
    projectId: string,
    query?: UsageRangeQueryDto,
  ): Promise<ApiResponse<ProjectUsageBreakdownData>> {
    return this.request(() =>
      this.client.get<ApiResponse<ProjectUsageBreakdownData>>(
        apiPath(`web/admin/usage/projects/${projectId}/breakdown`),
        { params: query },
      ),
    );
  }

  getProjectSummary(
    projectId: string,
    query?: UsageRangeQueryDto,
  ): Promise<ApiResponse<UsageSummaryData>> {
    return this.request(() =>
      this.client.get<ApiResponse<UsageSummaryData>>(
        apiPath(`web/admin/usage/projects/${projectId}`),
        { params: query },
      ),
    );
  }

  getProjectSeries(
    projectId: string,
    query?: UsageSeriesQueryDto,
  ): Promise<ApiResponse<UsageTimeSeriesData>> {
    return this.request(() =>
      this.client.get<ApiResponse<UsageTimeSeriesData>>(
        apiPath(`web/admin/usage/projects/${projectId}/series`),
        { params: query },
      ),
    );
  }

  listProjectEvents(
    projectId: string,
    query?: UsageEventsQueryDto,
  ): Promise<ApiResponse<UsageEventsPageData>> {
    return this.request(() =>
      this.client.get<ApiResponse<UsageEventsPageData>>(
        apiPath(`web/admin/usage/projects/${projectId}/events`),
        { params: query },
      ),
    );
  }

  getProjectKnowledgeUsage(
    projectId: string,
    query?: UsageRangeQueryDto,
  ): Promise<ApiResponse<ProjectKnowledgeUsageData>> {
    return this.request(() =>
      this.client.get<ApiResponse<ProjectKnowledgeUsageData>>(
        apiPath(`web/admin/usage/projects/${projectId}/knowledge`),
        { params: query },
      ),
    );
  }

  getProjectSessionUsage(
    projectId: string,
    query?: UsageRangeQueryDto,
  ): Promise<ApiResponse<ProjectSessionUsageData>> {
    return this.request(() =>
      this.client.get<ApiResponse<ProjectSessionUsageData>>(
        apiPath(`web/admin/usage/projects/${projectId}/sessions`),
        { params: query },
      ),
    );
  }

  async exportProjectUsage(
    projectId: string,
    query?: UsageExportQueryDto,
  ): Promise<string> {
    const response = await this.client.get<string>(
      apiPath(`web/admin/usage/projects/${projectId}/export`),
      { params: query, responseType: 'text' },
    );
    return response.data;
  }
}

export const platformUsageAdminApi = new PlatformUsageAdminApi();
