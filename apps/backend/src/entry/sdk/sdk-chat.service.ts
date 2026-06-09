import { Injectable } from '@nestjs/common';
import type {
  ChatMessageData,
  ChatStreamEvent,
  RequestContextData,
  SendChatMessageDto,
} from '@ahmedrioueche/actocore-shared';
import { ChatOrchestratorService } from '../../orchestrator/chat-orchestrator.service';
import { StudioAdminNotificationService } from '../../studio/studio-admin-notification.service';
import { isLlmInfraFailure } from './llm-infra-failure.util';

@Injectable()
export class SdkChatService {
  constructor(
    private readonly orchestrator: ChatOrchestratorService,
    private readonly adminNotifications: StudioAdminNotificationService,
  ) {}

  async sendMessage(
    context: RequestContextData,
    body: SendChatMessageDto,
  ): Promise<ChatMessageData> {
    try {
      return await this.orchestrator.sendMessage(context, body);
    } catch (error) {
      if (isLlmInfraFailure(error)) {
        void this.adminNotifications
          .maybeNotifyFailureForProject(
            context.projectId,
            'llm',
            'AI assistant provider error',
            [
              `An AI provider error occurred while handling a chat request in project "${context.projectName}".`,
              'End users may see a generic error until the provider recovers.',
              '',
              'Check provider status and project configuration in ActoCore Studio.',
            ].join('\n'),
          )
          .catch(() => undefined);
      }
      throw error;
    }
  }

  async streamMessage(
    context: RequestContextData,
    body: SendChatMessageDto,
    emit: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      await this.orchestrator.sendMessageStream(context, body, emit, signal);
    } catch (error) {
      if (isLlmInfraFailure(error)) {
        void this.adminNotifications
          .maybeNotifyFailureForProject(
            context.projectId,
            'llm',
            'AI assistant provider error',
            [
              `An AI provider error occurred while handling a chat request in project "${context.projectName}".`,
              'End users may see a generic error until the provider recovers.',
              '',
              'Check provider status and project configuration in ActoCore Studio.',
            ].join('\n'),
          )
          .catch(() => undefined);
      }
      throw error;
    }
  }
}
