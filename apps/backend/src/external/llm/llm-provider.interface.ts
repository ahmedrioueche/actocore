export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionResult {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface LlmProvider {
  complete(messages: LlmMessage[]): Promise<LlmCompletionResult>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
