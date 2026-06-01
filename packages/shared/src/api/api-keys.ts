import { apiPath } from '../config/api-version';
import { CreateApiKeyDto } from '../dtos/api-key.dto';
import type { ApiResponse } from '../types/api-response';
import type { ApiKeyIssuedData, ApiKeyMetadata } from '../types/api-key';
import { BaseApi } from './helper';

export class ApiKeysApi extends BaseApi {
  issue(body: CreateApiKeyDto): Promise<ApiResponse<ApiKeyIssuedData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ApiKeyIssuedData>>(
        apiPath('web/api-keys'),
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
