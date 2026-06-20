import { apiPath } from '../config/api-version';
import { ImportAppLayoutDto } from '../dtos/app-layout-export.dto';
import type { AppLayoutImportResult } from '../types/app-layout-export';
import type { ApiResponse } from '../types/api-response';
import { BaseApi } from './helper';

export class AppLayoutApi extends BaseApi {
  importLayout(
    projectId: string,
    body: ImportAppLayoutDto,
  ): Promise<ApiResponse<AppLayoutImportResult>> {
    return this.request(() =>
      this.client.post<ApiResponse<AppLayoutImportResult>>(
        apiPath(`web/projects/${projectId}/app-layout/import`),
        body,
      ),
    );
  }
}

export const appLayoutApi = new AppLayoutApi();
