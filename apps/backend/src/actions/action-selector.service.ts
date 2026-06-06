import { Inject, Injectable } from '@nestjs/common';
import type { ActionData } from '@ahmedrioueche/actocore-shared';
import { LLM_PROVIDER, type LlmProvider } from '../external/llm/llm-provider.interface';
import {
  extractNaturalLanguageActionInput,
  matchesNaturalLanguageAction,
} from './natural-language-action.util';

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
    sectionNames?: Map<string, string>,
  ): Promise<ActionSelection | null> {
    if (actions.length === 0) {
      return null;
    }

    const heuristic = this.selectHeuristic(userMessage, actions);
    if (heuristic) {
      return heuristic;
    }

    return this.selectWithLlm(userMessage, actions, sectionNames);
  }

  private selectHeuristic(
    userMessage: string,
    actions: ActionData[],
  ): ActionSelection | null {
    const jsonInput = this.extractJsonInput(userMessage);

    for (const action of actions) {
      if (!matchesNaturalLanguageAction(userMessage, action.name)) {
        continue;
      }

      const input =
        jsonInput ??
        extractNaturalLanguageActionInput(userMessage, action.name);

      return { action, input };
    }

    return null;
  }

  private async selectWithLlm(
    userMessage: string,
    actions: ActionData[],
    sectionNames?: Map<string, string>,
  ): Promise<ActionSelection | null> {
    const catalog = this.buildCatalog(actions, sectionNames);

    const completion = await this.llm.complete([
      {
        role: 'system',
        content:
          'You select one action for the user request. Infer parameters (email, name, etc.) from natural language. Reply with JSON only: {"action":"<name>","input":{}}. Use only listed action names.',
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

  /** Renders the action catalog, grouped by section name when section info is available. */
  private buildCatalog(
    actions: ActionData[],
    sectionNames?: Map<string, string>,
  ): string {
    const describe = (a: ActionData) =>
      `- ${a.name}: ${a.description ?? 'No description'}\n  schema: ${JSON.stringify(a.inputSchema)}`;

    if (!sectionNames || sectionNames.size === 0) {
      return actions.map(describe).join('\n');
    }

    const UNCATEGORIZED = 'Uncategorized';
    const groups = new Map<string, ActionData[]>();
    for (const action of actions) {
      const label =
        (action.sectionId && sectionNames.get(action.sectionId)) ||
        UNCATEGORIZED;
      const bucket = groups.get(label) ?? [];
      bucket.push(action);
      groups.set(label, bucket);
    }

    return Array.from(groups.entries())
      .map(
        ([section, items]) =>
          `## ${section}\n${items.map(describe).join('\n')}`,
      )
      .join('\n\n');
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
