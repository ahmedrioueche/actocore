import { apiPath } from '../config/api-version';
import { CreateProjectDto, UpdateProjectSettingsDto } from '../dtos/project.dto';
import type { ApiResponse } from '../types/api-response';
import type { ProjectData } from '../types/project';
import { BaseApi } from './helper';

export class ProjectsApi extends BaseApi {
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
}

export const projectsApi = new ProjectsApi();
