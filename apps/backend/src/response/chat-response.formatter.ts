import { Injectable } from '@nestjs/common';
import type {
  ActionExecutionResult,
  ChatIntent,
  ChatMessageData,
  QaSourceCitation,
  TokenUsageData,
} from '@ahmedrioueche/actocore-shared';

export interface OrchestratorBranchPayload {
  content: string;
  usage?: TokenUsageData;
  action?: ActionExecutionResult;
  sources?: QaSourceCitation[];
  intentOverride?: ChatIntent;
}

@Injectable()
export class ChatResponseFormatter {
  /** Single formatter for direct, Q&A, and action orchestration branches. */
  format(input: {
    sessionId: string;
    messageId: string;
    intent: ChatIntent;
    branch: OrchestratorBranchPayload;
  }): ChatMessageData {
    const { sessionId, messageId, intent, branch } = input;
    const resolvedIntent = branch.intentOverride ?? intent;

    const response: ChatMessageData = {
      sessionId,
      messageId,
      role: 'assistant',
      content: branch.content.trim(),
      intent: resolvedIntent,
      usage: branch.usage,
    };

    if (resolvedIntent === 'action' && branch.action) {
      response.action = branch.action;
    }

    if (resolvedIntent === 'qa' && branch.sources && branch.sources.length > 0) {
      response.sources = branch.sources;
    }

    return response;
  }
}
