import { apiPath } from '../config/api-version';
import {
  CreateAppPageLinkDto,
  UpdateAppPageLinkDto,
} from '../dtos/app-page.dto';
import type { AppPageLinkData } from '../types/app-page';
import type { ApiResponse } from '../types/api-response';
import { BaseApi } from './helper';

export class AppPageLinksApi extends BaseApi {
  list(projectId: string): Promise<ApiResponse<AppPageLinkData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<AppPageLinkData[]>>(
        apiPath(`web/projects/${projectId}/app-page-links`),
      ),
    );
  }

  create(
    projectId: string,
    body: CreateAppPageLinkDto,
  ): Promise<ApiResponse<AppPageLinkData>> {
    return this.request(() =>
      this.client.post<ApiResponse<AppPageLinkData>>(
        apiPath(`web/projects/${projectId}/app-page-links`),
        body,
      ),
    );
  }

  update(
    projectId: string,
    linkId: string,
    body: UpdateAppPageLinkDto,
  ): Promise<ApiResponse<AppPageLinkData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<AppPageLinkData>>(
        apiPath(`web/projects/${projectId}/app-page-links/${linkId}`),
        body,
      ),
    );
  }

  remove(
    projectId: string,
    linkId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ id: string }>>(
        apiPath(`web/projects/${projectId}/app-page-links/${linkId}`),
      ),
    );
  }
}

export const appPageLinksApi = new AppPageLinksApi();
