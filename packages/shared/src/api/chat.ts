import { sdkApiPath } from '../config/api-version';
import { SendChatMessageDto } from '../dtos/chat.dto';
import type { ApiResponse } from '../types/api-response';
import type { ChatMessageData } from '../types/chat';
import {
  streamChatMessage,
  type StreamChatMessageOptions,
} from './chat-stream';
import { BaseApi } from './helper';

export class ChatApi extends BaseApi {
  sendMessage(body: SendChatMessageDto): Promise<ApiResponse<ChatMessageData>> {
    return this.request(() =>
      this.client.post<ApiResponse<ChatMessageData>>(sdkApiPath('chat'), body),
    );
  }

  streamMessage(
    body: SendChatMessageDto,
    options: Omit<StreamChatMessageOptions, 'apiKey' | 'baseURL'>,
  ): Promise<void> {
    return streamChatMessage(body, options);
  }
}

export const chatApi = new ChatApi();
export { streamChatMessage, type StreamChatMessageOptions };
export {
  consumeSseBuffer,
  parseSseDataLines,
  parseChatStreamEvent,
} from './sse';
