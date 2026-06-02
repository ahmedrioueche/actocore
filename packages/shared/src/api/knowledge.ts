import { apiPath } from '../config/api-version';
import { CreateKnowledgeSourceDto } from '../dtos/knowledge.dto';
import type { ApiResponse } from '../types/api-response';
import type { KnowledgeSourceData } from '../types/knowledge';
import { BaseApi } from './helper';

export class KnowledgeApi extends BaseApi {
  create(
    projectId: string,
    body: CreateKnowledgeSourceDto,
  ): Promise<ApiResponse<KnowledgeSourceData>> {
    return this.request(() =>
      this.client.post<ApiResponse<KnowledgeSourceData>>(
        apiPath(`web/projects/${projectId}/knowledge`),
        body,
      ),
    );
  }

  list(projectId: string): Promise<ApiResponse<KnowledgeSourceData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<KnowledgeSourceData[]>>(
        apiPath(`web/projects/${projectId}/knowledge`),
      ),
    );
  }

  get(
    projectId: string,
    sourceId: string,
  ): Promise<ApiResponse<KnowledgeSourceData>> {
    return this.request(() =>
      this.client.get<ApiResponse<KnowledgeSourceData>>(
        apiPath(`web/projects/${projectId}/knowledge/${sourceId}`),
      ),
    );
  }

  remove(
    projectId: string,
    sourceId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    return this.request(() =>
      this.client.delete<ApiResponse<{ id: string }>>(
        apiPath(`web/projects/${projectId}/knowledge/${sourceId}`),
      ),
    );
  }
}

export const knowledgeApi = new KnowledgeApi();
