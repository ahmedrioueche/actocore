import { apiPath } from '../config/api-version';
import {
  CreateActionSectionDto,
  ReorderActionSectionsDto,
  UpdateActionSectionDto,
} from '../dtos/action.dto';
import type { ActionSectionData } from '../types/action';
import type { ApiResponse } from '../types/api-response';
import { BaseApi } from './helper';

export class ActionSectionsApi extends BaseApi {
  list(projectId: string): Promise<ApiResponse<ActionSectionData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<ActionSectionData[]>>(
        apiPath(`web/projects/${projectId}/action-sections`),
      ),
    );
  }

  create(
    projectId: string,
    body: CreateActionSectionDto,
  ): Promise<ApiResponse<ActionSectionData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ActionSectionData>>(
        apiPath(`web/projects/${projectId}/action-sections`),
        body,
      ),
    );
  }

  update(
    projectId: string,
    sectionId: string,
    body: UpdateActionSectionDto,
  ): Promise<ApiResponse<ActionSectionData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<ActionSectionData>>(
        apiPath(`web/projects/${projectId}/action-sections/${sectionId}`),
        body,
      ),
    );
  }

  remove(
    projectId: string,
    sectionId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ id: string }>>(
        apiPath(`web/projects/${projectId}/action-sections/${sectionId}`),
      ),
    );
  }

  reorder(
    projectId: string,
    body: ReorderActionSectionsDto,
  ): Promise<ApiResponse<ActionSectionData[]>> {
    return this.request(() =>
      this.client.patch<ApiResponse<ActionSectionData[]>>(
        apiPath(`web/projects/${projectId}/action-sections/reorder`),
        body,
      ),
    );
  }
}

export const actionSectionsApi = new ActionSectionsApi();
