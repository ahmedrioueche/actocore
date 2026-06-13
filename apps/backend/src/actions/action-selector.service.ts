import { Inject, Injectable } from '@nestjs/common';
import type { ActionData, HostContext } from '@ahmedrioueche/actocore-shared';
import { LLM_PROVIDER, type LlmProvider } from '../external/llm/llm-provider.interface';
import {
  extractNaturalLanguageActionInput,
  matchesNaturalLanguageAction,
} from './natural-language-action.util';

export interface ActionSelection {
  action: ActionData;
  input: Record<string, unknown>;
}

export interface ActionSelectorOptions {
  sectionNames?: Map<string, string>;
  pageTitles?: Map<string, string>;
  /** Mongo id of the current app page when hostContext.currentPage slug is set. */
  currentPageId?: string;
}

@Injectable()
export class ActionSelectorService {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}

  async select(
    userMessage: string,
    actions: ActionData[],
    options?: ActionSelectorOptions,
  ): Promise<ActionSelection | null> {
    if (actions.length === 0) {
      return null;
    }

    const ranked = this.rankActions(actions, options?.currentPageId);
    const sectionNames = options?.sectionNames;

    const heuristic = this.selectHeuristic(userMessage, ranked);
    if (heuristic) {
      return heuristic;
    }

    return this.selectWithLlm(userMessage, ranked, options);
  }

  private rankActions(actions: ActionData[], currentPageId?: string): ActionData[] {
    if (!currentPageId) {
      return actions;
    }

    const onPage: ActionData[] = [];
    const other: ActionData[] = [];

    for (const action of actions) {
      if (action.pageIds?.includes(currentPageId)) {
        onPage.push(action);
      } else {
        other.push(action);
      }
    }

    return [...onPage, ...other];
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
    options?: ActionSelectorOptions,
  ): Promise<ActionSelection | null> {
    const catalog = this.buildCatalog(actions, options);

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
    options?: ActionSelectorOptions,
  ): string {
    const pageTitles = options?.pageTitles;
    const describe = (a: ActionData) => {
      const pageLabels =
        a.pageIds
          ?.map((id) => pageTitles?.get(id))
          .filter((label): label is string => Boolean(label)) ?? [];
      const pagesSuffix =
        pageLabels.length > 0 ? ` [pages: ${pageLabels.join(', ')}]` : '';
      return `- ${a.name}: ${a.description ?? 'No description'}${pagesSuffix}\n  schema: ${JSON.stringify(a.inputSchema)}`;
    };

    const sectionNames = options?.sectionNames;
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
