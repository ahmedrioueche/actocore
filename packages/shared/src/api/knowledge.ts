import { apiPath } from '../config/api-version';
import { CreateKnowledgeSourceDto } from '../dtos/knowledge.dto';
import type { ApiResponse } from '../types/api-response';
import type { KnowledgeSourceData } from '../types/knowledge';
import type { Paginated, PaginationQuery } from '../types/pagination';
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

  list(
    projectId: string,
    query: PaginationQuery = {},
  ): Promise<ApiResponse<Paginated<KnowledgeSourceData>>> {
    const params = new URLSearchParams();
    if (query.page != null) {
      params.set('page', String(query.page));
    }
    if (query.limit != null) {
      params.set('limit', String(query.limit));
    }
    const qs = params.toString();
    return this.request(() =>
      this.client.get<ApiResponse<Paginated<KnowledgeSourceData>>>(
        apiPath(`web/projects/${projectId}/knowledge${qs ? `?${qs}` : ''}`),
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

  upload(
    projectId: string,
    file: Blob,
    options?: { title?: string; filename?: string },
  ): Promise<ApiResponse<KnowledgeSourceData>> {
    const form = new FormData();
    form.append('file', file, options?.filename ?? 'upload.bin');

    const params = new URLSearchParams();
    if (options?.title?.trim()) {
      params.set('title', options.title.trim());
    }
    const query = params.toString();
    const path = query
      ? `${apiPath(`web/projects/${projectId}/knowledge/upload`)}?${query}`
      : apiPath(`web/projects/${projectId}/knowledge/upload`);

    return this.request(() =>
      this.client.post<ApiResponse<KnowledgeSourceData>>(path, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  }
}

export const knowledgeApi = new KnowledgeApi();
