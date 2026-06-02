import type { ActionExecutionResult } from './action';
import type { QaSourceCitation } from './knowledge';

/** How the orchestrator routes the user message. */
export type ChatIntent = 'direct' | 'qa' | 'action';

export interface TokenUsageData {
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface ChatMessageData {
  sessionId: string;
  messageId: string;
  role: 'assistant';
  content: string;
  intent: ChatIntent;
  usage?: TokenUsageData;
  /** Present when `intent` is `action` and an action was selected. */
  action?: ActionExecutionResult;
  /** Present when `intent` is `qa` and knowledge was retrieved. */
  sources?: QaSourceCitation[];
}
