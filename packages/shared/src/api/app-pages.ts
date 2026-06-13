import { apiPath } from '../config/api-version';
import {
  AssignAppPageActionsDto,
  CreateAppPageDto,
  ReorderAppPagesDto,
  UpdateAppPageDto,
} from '../dtos/app-page.dto';
import type { AppPageData } from '../types/app-page';
import type { ApiResponse } from '../types/api-response';
import { BaseApi } from './helper';

export class AppPagesApi extends BaseApi {
  list(projectId: string): Promise<ApiResponse<AppPageData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<AppPageData[]>>(
        apiPath(`web/projects/${projectId}/app-pages`),
      ),
    );
  }

  create(
    projectId: string,
    body: CreateAppPageDto,
  ): Promise<ApiResponse<AppPageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<AppPageData>>(
        apiPath(`web/projects/${projectId}/app-pages`),
        body,
      ),
    );
  }

  update(
    projectId: string,
    pageId: string,
    body: UpdateAppPageDto,
  ): Promise<ApiResponse<AppPageData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<AppPageData>>(
        apiPath(`web/projects/${projectId}/app-pages/${pageId}`),
        body,
      ),
    );
  }

  remove(
    projectId: string,
    pageId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ id: string }>>(
        apiPath(`web/projects/${projectId}/app-pages/${pageId}`),
      ),
    );
  }

  reorder(
    projectId: string,
    body: ReorderAppPagesDto,
  ): Promise<ApiResponse<AppPageData[]>> {
    return this.request(() =>
      this.client.patch<ApiResponse<AppPageData[]>>(
        apiPath(`web/projects/${projectId}/app-pages/reorder`),
        body,
      ),
    );
  }

  assignActions(
    projectId: string,
    pageId: string,
    body: AssignAppPageActionsDto,
  ): Promise<ApiResponse<AppPageData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<AppPageData>>(
        apiPath(`web/projects/${projectId}/app-pages/${pageId}/actions`),
        body,
      ),
    );
  }
}

export const appPagesApi = new AppPagesApi();
