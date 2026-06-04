import { apiPath } from '../config/api-version';
import { UpdateSdkProjectConfigDto } from '../dtos/sdk-config.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  SdkConfigAuditEntryData,
  SdkProjectConfigData,
} from '../types/sdk-config';
import { BaseApi } from './helper';

export class SdkConfigApi extends BaseApi {
  get(projectId: string): Promise<ApiResponse<SdkProjectConfigData>> {
    return this.request(() =>
      this.client.get<ApiResponse<SdkProjectConfigData>>(
        apiPath(`web/projects/${projectId}/sdk-config`),
      ),
    );
  }

  update(
    projectId: string,
    body: UpdateSdkProjectConfigDto,
  ): Promise<ApiResponse<SdkProjectConfigData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<SdkProjectConfigData>>(
        apiPath(`web/projects/${projectId}/sdk-config`),
        body,
      ),
    );
  }

  listAudit(
    projectId: string,
    limit?: number,
  ): Promise<ApiResponse<SdkConfigAuditEntryData[]>> {
    const query = limit != null ? `?limit=${limit}` : '';
    return this.request(() =>
      this.client.get<ApiResponse<SdkConfigAuditEntryData[]>>(
        apiPath(`web/projects/${projectId}/sdk-config/audit${query}`),
      ),
    );
  }
}

export const sdkConfigApi = new SdkConfigApi();
