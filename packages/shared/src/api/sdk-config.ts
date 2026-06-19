import { apiPath } from '../config/api-version';
import { TranslateSdkCopyDto } from '../dtos/sdk-label-translate.dto';
import { UpdateSdkProjectConfigDto } from '../dtos/sdk-config.dto';
import type { ApiResponse } from '../types/api-response';
import type {
  SdkConfigAuditEntryData,
  SdkProjectConfigData,
} from '../types/sdk-config';
import type { TranslateSdkCopyResultData } from '../types/sdk-label';
import type { Paginated, PaginationQuery } from '../types/pagination';
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
    query: PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<SdkConfigAuditEntryData>>> {
    const params = new URLSearchParams();
    if (query.page != null) {
      params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params.set('limit', String(query.limit));
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<SdkConfigAuditEntryData>>>(
        apiPath(
          `web/projects/${projectId}/sdk-config/audit${qs ? `?${qs}` : ''}`,
        ),
      ),
    );
  }

  translateCopy(
    projectId: string,
    body: TranslateSdkCopyDto,
  ): Promise<ApiResponse<TranslateSdkCopyResultData>> {
    return this.request(() =>
      this.client.post<ApiResponse<TranslateSdkCopyResultData>>(
        apiPath(`web/projects/${projectId}/sdk-config/translate-copy`),
        body,
      ),
    );
  }
}

export const sdkConfigApi = new SdkConfigApi();
