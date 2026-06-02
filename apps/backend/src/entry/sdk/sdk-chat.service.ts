import { Injectable } from '@nestjs/common';
import type {
  ChatMessageData,
  RequestContextData,
  SendChatMessageDto,
} from '@ahmedrioueche/actocore-shared';
import { ChatOrchestratorService } from '../../orchestrator/chat-orchestrator.service';

@Injectable()
export class SdkChatService {
  constructor(private readonly orchestrator: ChatOrchestratorService) {}

  sendMessage(
    context: RequestContextData,
    body: SendChatMessageDto,
  ): Promise<ChatMessageData> {
    return this.orchestrator.sendMessage(context, body);
  }
}
