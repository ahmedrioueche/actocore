import { apiPath } from '../config/api-version';
import { CreateActionDto, UpdateActionDto } from '../dtos/action.dto';
import type { ApiResponse } from '../types/api-response';
import type { ActionData } from '../types/action';
import type { Paginated, PaginationQuery } from '../types/pagination';
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

  list(
    projectId: string,
    query: PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<ActionData>>> {
    const params = new URLSearchParams();
    if (query.page != null) {
      params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params.set('limit', String(query.limit));
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<ActionData>>>(
        apiPath(`web/projects/${projectId}/actions${qs ? `?${qs}` : ''}`),
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
