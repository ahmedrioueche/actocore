import { apiPath } from '../config/api-version';
import {
  AssignAppPageActionsDto,
  CreateAppPageDto,
  CreateAppPageFunctionalityDto,
  ReorderAppPagesDto,
  UpdateAppPageDto,
  UpdateAppPageFunctionalityDto,
  UpdateAppPageGraphLayoutDto,
} from '../dtos/app-page.dto';
import type { AppPageData, AppPageFunctionality } from '../types/app-page';
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

  updateGraphLayout(
    projectId: string,
    body: UpdateAppPageGraphLayoutDto,
  ): Promise<ApiResponse<AppPageData[]>> {
    return this.request(() =>
      this.client.patch<ApiResponse<AppPageData[]>>(
        apiPath(`web/projects/${projectId}/app-pages/graph-layout`),
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

  createFunctionality(
    projectId: string,
    pageId: string,
    body: CreateAppPageFunctionalityDto,
  ): Promise<ApiResponse<AppPageFunctionality>> {
    return this.request(() =>
      this.client.post<ApiResponse<AppPageFunctionality>>(
        apiPath(
          `web/projects/${projectId}/app-pages/${pageId}/functionalities`,
        ),
        body,
      ),
    );
  }

  updateFunctionality(
    projectId: string,
    pageId: string,
    functionalityId: string,
    body: UpdateAppPageFunctionalityDto,
  ): Promise<ApiResponse<AppPageFunctionality>> {
    return this.request(() =>
      this.client.patch<ApiResponse<AppPageFunctionality>>(
        apiPath(
          `web/projects/${projectId}/app-pages/${pageId}/functionalities/${functionalityId}`,
        ),
        body,
      ),
    );
  }

  removeFunctionality(
    projectId: string,
    pageId: string,
    functionalityId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ id: string }>>(
        apiPath(
          `web/projects/${projectId}/app-pages/${pageId}/functionalities/${functionalityId}`,
        ),
      ),
    );
  }
}

export const appPagesApi = new AppPagesApi();
