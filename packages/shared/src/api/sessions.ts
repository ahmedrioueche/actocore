import { apiPath } from '../config/api-version';
import { CreateSessionDto } from '../dtos/session.dto';
import type { ApiResponse } from '../types/api-response';
import type { SessionData, SessionMessageData } from '../types/session';
import { BaseApi } from './helper';

export class SessionsApi extends BaseApi {
  create(body: CreateSessionDto = {}): Promise<ApiResponse<SessionData>> {
    return this.request(() =>
      this.client.post<ApiResponse<SessionData>>(apiPath('sdk/sessions'), body),
    );
  }

  get(sessionId: string): Promise<ApiResponse<SessionData>> {
    return this.request(() =>
      this.client.get<ApiResponse<SessionData>>(
        apiPath(`sdk/sessions/${sessionId}`),
      ),
    );
  }

  listMessages(sessionId: string): Promise<ApiResponse<SessionMessageData[]>> {
    return this.request(() =>
      this.client.get<ApiResponse<SessionMessageData[]>>(
        apiPath(`sdk/sessions/${sessionId}/messages`),
      ),
    );
  }
}

export const sessionsApi = new SessionsApi();
