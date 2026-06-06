import { apiPath } from '../config/api-version';
import { CreateApiKeyDto, UpdateApiKeyDto } from '../dtos/api-key.dto';
import type { ApiResponse } from '../types/api-response';
import type { ApiKeyIssuedData, ApiKeyMetadata } from '../types/api-key';
import { BaseApi } from './helper';

export class ApiKeysApi extends BaseApi {
  listForProject(
    projectId: string,
    options?: { includeRevoked?: boolean },
  ): Promise<ApiResponse<ApiKeyMetadata[]>> {
    const params = options?.includeRevoked ? { includeRevoked: 'true' } : undefined;
    return this.request(() =>
      this.client.get<ApiResponse<ApiKeyMetadata[]>>(
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
