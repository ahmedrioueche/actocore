import { apiPath } from '../config/api-version';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectSettingsDto,
} from '../dtos/project.dto';
import type { ApiResponse } from '../types/api-response';
import type { Paginated } from '../types/pagination';
import type {
  ListProjectSessionsQuery,
  ListProjectsQuery,
  ProjectData,
} from '../types/project';
import type { SessionData, SessionMessageData } from '../types/session';
import type { ProjectQuotaStatusData } from '../types/usage';
import type { StudioMessageData } from '../types/studio';
import { BaseApi } from './helper';

export class ProjectsApi extends BaseApi {
  list(
    query: ListProjectsQuery = {},
  ): Promise<ApiResponse<Paginated<ProjectData>>> {
    const params = new URLSearchParams();
    if (query.page != null) {
      params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query.archived === true) {
      params.set('archived', 'true');
    } else if (query.archived === false) {
      params.set('archived', 'false');
    }
    if (query.search?.trim()) {
      params.set('search', query.search.trim());
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<ProjectData>>>(
        apiPath(`web/projects${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  create(body: CreateProjectDto): Promise<ApiResponse<ProjectData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ProjectData>>(apiPath('web/projects'), body),
    );
  }

  get(projectId: string): Promise<ApiResponse<ProjectData>> {
    return this.request(() =>
      this.client.get<ApiResponse<ProjectData>>(
        apiPath(`web/projects/${projectId}`),
      ),
    );
  }

  update(
    projectId: string,
    body: UpdateProjectDto,
  ): Promise<ApiResponse<ProjectData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<ProjectData>>(
        apiPath(`web/projects/${projectId}`),
        body,
      ),
    );
  }

  updateSettings(
    projectId: string,
    body: UpdateProjectSettingsDto,
  ): Promise<ApiResponse<ProjectData>> {
    return this.request(() =>
      this.client.patch<ApiResponse<ProjectData>>(
        apiPath(`web/projects/${projectId}/settings`),
        body,
      ),
    );
  }

  delete(projectId: string): Promise<ApiResponse<StudioMessageData>> {
    return this.request(() =>
      this.client.delete<ApiResponse<StudioMessageData>>(
        apiPath(`web/projects/${projectId}`),
      ),
    );
  }

  getQuota(projectId: string): Promise<ApiResponse<ProjectQuotaStatusData>> {
    return this.request(() =>
      this.client.get<ApiResponse<ProjectQuotaStatusData>>(
        apiPath(`web/projects/${projectId}/usage/quota`),
      ),
    );
  }

  listSessions(
    projectId: string,
    query: ListProjectSessionsQuery = {},
  ): Promise<ApiResponse<Paginated<SessionData>>> {
    const params = new URLSearchParams();
    if (query.page != null) {
      params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query.externalUserId?.trim()) {
      params.set('externalUserId', query.externalUserId.trim());
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<SessionData>>>(
        apiPath(`web/projects/${projectId}/sessions${qs ? `?${qs}` : ''}`),
      ),
    );
  }

  listSessionMessages(
    projectId: string,
    sessionId: string,
  ): Promise<ApiResponse<SessionMessageData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<SessionMessageData[]>>(
        apiPath(`web/projects/${projectId}/sessions/${sessionId}/messages`),
      ),
    );
  }
}

export const projectsApi = new ProjectsApi();
