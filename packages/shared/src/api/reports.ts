import { apiPath } from '../config/api-version';
import type { CreateStudioReportDto } from '../dtos/report.dto';
import type { ApiResponse } from '../types/api-response';
import type { Paginated, PaginationQuery } from '../types/pagination';
import type { StudioReportData } from '../types/report';
import { BaseApi } from './helper';

/** Tenant workspace reports (`/v1/web/reports/*`). */
export class ReportsApi extends BaseApi {
  createReport(
    body: CreateStudioReportDto,
  ): Promise<ApiResponse<StudioReportData>> {
    return this.request(() =>
      this.client.post<ApiResponse<StudioReportData>>(
        apiPath('web/reports'),
        body,
      ),
    );
  }

  listMyReports(
    options: PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<StudioReportData>>> {
    const params = new URLSearchParams();
    if (options.page != null) params.set('page', String(options.page));
    if (options.limit != null) params.set('limit', String(options.limit));
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<StudioReportData>>>(
        apiPath(`web/reports${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  getMyReport(reportId: string): Promise<ApiResponse<StudioReportData>> {
    return this.request(() =>
      this.client.get<ApiResponse<StudioReportData>>(
        apiPath(`web/reports/${reportId}`),
      ),
    );
  }
}

export const reportsApi = new ReportsApi();
