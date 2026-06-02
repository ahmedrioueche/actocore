import { apiPath } from '../config/api-version';
import type { ApiResponse } from '../types/api-response';
import type { ActionData } from '../types/action';
import { BaseApi } from './helper';

export class SdkActionsApi extends BaseApi {
  list(): Promise<ApiResponse<ActionData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<ActionData[]>>(apiPath('sdk/actions')),
    );
  }
}

export const sdkActionsApi = new SdkActionsApi();
