import { apiPath } from '../config/api-version';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dtos/api-key.dto';
import type { ApiResponse } from '../types/api-response';
import type { ApiKeyIssuedData, ApiKeyMetadata } from '../types/api-key';
import type { Paginated, PaginationQuery } from '../types/pagination';
import { BaseApi } from './helper';

export class ApiKeysApi extends BaseApi {
  listForProject(
    projectId: string,
    options?: { includeRevoked?: boolean } & PaginationQuery,
  ): Promise<ApiResponse<Paginated<ApiKeyMetadata>>> {
    const params: Record<string, string> = {};
    if (options?.includeRevoked) {
      params.includeRevoked = 'true';
    }
    if (options?.page != null) {
      params.page = String(options.page);
    }
    if (options?.limit != null) {
      params.limit = String(options.limit);
    }
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<ApiKeyMetadata>>>(
        apiPath(`web/projects/${projectId}/api-keys`),
        { params },
      ),
    );
  }

  issue(body: CreateApiKeyDto): Promise<ApiResponse<ApiKeyIssuedData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ApiKeyIssuedData>>(
        apiPath('web/api-keys'),
        body,
      ),
    );
  }

  update(
    keyId: string,
    body: UpdateApiKeyDto,
  ): Promise<ApiResponse<ApiKeyMetadata>> {
    return this.request(() =>
      this.client.patch<ApiResponse<ApiKeyMetadata>>(
        apiPath(`web/api-keys/${keyId}`),
        body,
      ),
    );
  }

  revoke(keyId: string): Promise<ApiResponse<ApiKeyMetadata>> {
    return this.request(() =>
      this.client.delete<ApiResponse<ApiKeyMetadata>>(
        apiPath(`web/api-keys/${keyId}`),
      ),
    );
  }
}

export const apiKeysApi = new ApiKeysApi();
