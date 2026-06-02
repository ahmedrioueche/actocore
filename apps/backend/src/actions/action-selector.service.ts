import { Inject, Injectable } from '@nestjs/common';
import type { ActionData } from '@ahmedrioueche/actocore-shared';
import { LLM_PROVIDER, type LlmProvider } from '../external/llm/llm-provider.interface';

export interface ActionSelection {
  action: ActionData;
  input: Record<string, unknown>;
}

@Injectable()
export class ActionSelectorService {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async select(
    userMessage: string,
    actions: ActionData[],
  ): Promise<ActionSelection | null> {
    if (actions.length === 0) {
      return null;
    }

    const heuristic = this.selectHeuristic(userMessage, actions);
    if (heuristic) {
      return heuristic;
    }

    return this.selectWithLlm(userMessage, actions);
  }

  private selectHeuristic(
    userMessage: string,
    actions: ActionData[],
  ): ActionSelection | null {
    const lower = userMessage.toLowerCase();

    for (const action of actions) {
      const name = action.name.toLowerCase();
      if (lower.includes(name)) {
        return {
          action,
          input: this.extractJsonInput(userMessage) ?? {},
        };
      }
    }

    return null;
  }

  private async selectWithLlm(
    userMessage: string,
    actions: ActionData[],
  ): Promise<ActionSelection | null> {
    const catalog = actions
      .map(
        (a) =>
          `- ${a.name}: ${a.description ?? 'No description'}\n  schema: ${JSON.stringify(a.inputSchema)}`,
      )
      .join('\n');

    const completion = await this.llm.complete([
      {
        role: 'system',
        content:
          'You select one action for the user request. Reply with JSON only: {"action":"<name>","input":{}}. Use only listed action names.',
      },
      {
        role: 'user',
        content: `Actions:\n${catalog}\n\nUser: ${userMessage}`,
      },
    ]);

    try {
      const parsed = JSON.parse(this.extractJson(completion.content)) as {
        action?: string;
        input?: Record<string, unknown>;
      };
      const action = actions.find((a) => a.name === parsed.action);
      if (!action) {
        return null;
      }
      return {
        action,
        input:
          parsed.input !== null &&
          typeof parsed.input === 'object' &&
          !Array.isArray(parsed.input)
            ? parsed.input
            : {},
      };
    } catch {
      return null;
    }
  }

  private extractJsonInput(
    message: string,
  ): Record<string, unknown> | null {
    const match = message.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }

  private extractJson(content: string): string {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) {
      return fenced[1].trim();
    }
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return content.slice(start, end + 1);
    }
    return content.trim();
  }
}
