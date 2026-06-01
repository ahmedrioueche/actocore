import { apiPath } from '../config/api-version';
import { SendChatMessageDto } from '../dtos/chat.dto';
import type { ApiResponse } from '../types/api-response';
import type { ChatMessageData } from '../types/chat';
import { BaseApi } from './helper';

export class ChatApi extends BaseApi {
  sendMessage(body: SendChatMessageDto): Promise<ApiResponse<ChatMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ChatMessageData>>(apiPath('sdk/chat'), body),
    );
  }
}

export const chatApi = new ChatApi();
