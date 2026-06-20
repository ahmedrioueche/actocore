import { apiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { SdkManifestData } from '../types/sdk-manifest';
import { BaseApi } from './helper';

export class SdkManifestApi extends BaseApi {
  get(): Promise<ApiResponse<SdkManifestData>> {
    return this.request(() =>
      this.client.get<ApiResponse<SdkManifestData>>(apiPath('sdk/manifest')),
    );
  }
}

export const sdkManifestApi = new SdkManifestApi();
