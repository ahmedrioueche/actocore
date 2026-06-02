import { apiPath } from '../config/api-version';
import { CreateActionDto, UpdateActionDto } from '../dtos/action.dto';
import type { ApiResponse } from '../types/api-response';
import type { ActionData } from '../types/action';
import { BaseApi } from './helper';

export class ActionsApi extends BaseApi {
  create(
    projectId: string,
    body: CreateActionDto,
  ): Promise<ApiResponse<ActionData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ActionData>>(
        apiPath(`web/projects/${projectId}/actions`),
        body,
      ),
    );
  }

  list(projectId: string): Promise<ApiResponse<ActionData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<ActionData[]>>(
        apiPath(`web/projects/${projectId}/actions`),
      ),
    );
  }

  get(
    projectId: string,
    actionId: string,
  ): Promise<ApiResponse<ActionData>> {
    return this.request(() =>
      this.client.get<ApiResponse<ActionData>>(
        apiPath(`web/projects/${projectId}/actions/${actionId}`),
      ),
    );
  }

  update(
    projectId: string,
    actionId: string,
    body: UpdateActionDto,
  ): Promise<ApiResponse<ActionData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<ActionData>>(
        apiPath(`web/projects/${projectId}/actions/${actionId}`),
        body,
      ),
    );
  }

  remove(
    projectId: string,
    actionId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ id: string }>>(
        apiPath(`web/projects/${projectId}/actions/${actionId}`),
      ),
    );
  }
}

export const actionsApi = new ActionsApi();
