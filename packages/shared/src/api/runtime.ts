import { sdkApiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { RuntimeConfigData } from '../types/runtime';
import { BaseApi } from './helper';

export class RuntimeApi extends BaseApi {
  getConfig(): Promise<ApiResponse<RuntimeConfigData>> {
    return this.request(() =>
      this.client.get<ApiResponse<RuntimeConfigData>>(sdkApiPath('runtime')),
    );
  }
}

export const runtimeApi = new RuntimeApi();
