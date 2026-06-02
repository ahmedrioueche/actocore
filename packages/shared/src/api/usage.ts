import { apiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { UsageSummaryData } from '../types/usage';
import { BaseApi } from './helper';

export class UsageApi extends BaseApi {
  getProjectSummary(projectId: string): Promise<ApiResponse<UsageSummaryData>> {
    return this.request(() =>
      this.client.get<ApiResponse<UsageSummaryData>>(
        apiPath(`web/projects/${projectId}/usage`),
      ),
    );
  }
}

export const usageApi = new UsageApi();
