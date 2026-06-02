import type { LlmMessage } from './llm-provider.interface';

export function splitSystemMessages(messages: LlmMessage[]): {
  system: string | undefined;
  conversation: LlmMessage[];
} {
  const systemParts: string[] = [];
  const conversation: LlmMessage[] = [];

  for (const message of messages) {
    if (message.role === 'system') {
      systemParts.push(message.content);
    } else {
      conversation.push(message);
    }
  }

  return {
    system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
    conversation,
  };
}

/** OpenAI chat completions accept system / user / assistant roles as-is. */
export function toOpenAiMessages(messages: LlmMessage[]): LlmMessage[] {
  return messages;
}

/** Anthropic Messages API: system is a top-level field; messages are user/assistant only. */
export function toAnthropicPayload(messages: LlmMessage[]): {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const { system, conversation } = splitSystemMessages(messages);

  return {
    system,
    messages: conversation.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  };
}

/** Gemini generateContent: `model` role instead of `assistant`. */
export function toGeminiPayload(messages: LlmMessage[]): {
  systemInstruction?: { parts: Array<{ text: string }> };
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
} {
  const { system, conversation } = splitSystemMessages(messages);

  return {
    systemInstruction: system
      ? { parts: [{ text: system }] }
      : undefined,
    contents: conversation.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  };
}
