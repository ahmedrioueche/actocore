import type { ApiResponse } from '../types/api-response';
import type { HealthCheckData } from '../types/health';
import { BaseApi } from './helper';

export class HealthApi extends BaseApi {
  getLive(): Promise<ApiResponse<{ status: 'ok' }>> {
    return this.request(() =>
      this.client.get<ApiResponse<{ status: 'ok' }>>('/health/live'),
    );
  }

  getReady(): Promise<ApiResponse<HealthCheckData>> {
    return this.request(() =>
      this.client.get<ApiResponse<HealthCheckData>>('/health/ready'),
    );
  }
}

export const healthApi = new HealthApi();
