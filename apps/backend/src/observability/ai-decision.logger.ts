import { Injectable, Logger } from '@nestjs/common';
import type { ChatIntent } from '@ahmedrioueche/actocore-shared';

export interface AiDecisionLogEntry {
  projectId: string;
  sessionId: string;
  intent: ChatIntent;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  actionName?: string;
  actionStatus?: string;
  sourceCount?: number;
}

@Injectable()
export class AiDecisionLogger {
  private readonly logger = new Logger('AiDecision');

  log(entry: AiDecisionLogEntry): void {
    const parts = [
      `project=${entry.projectId}`,
      `session=${entry.sessionId}`,
      `intent=${entry.intent}`,
    ];

    if (entry.model) {
      parts.push(`model=${entry.model}`);
    }
    if (entry.promptTokens !== undefined) {
      parts.push(`promptTokens=${entry.promptTokens}`);
    }
    if (entry.completionTokens !== undefined) {
      parts.push(`completionTokens=${entry.completionTokens}`);
    }
    if (entry.actionName) {
      parts.push(`action=${entry.actionName}`);
    }
    if (entry.actionStatus) {
      parts.push(`actionStatus=${entry.actionStatus}`);
    }
    if (entry.sourceCount !== undefined) {
      parts.push(`sources=${entry.sourceCount}`);
    }

    this.logger.log(parts.join(' '));
  }

  logActionFailure(projectId: string, actionName: string, error: string): void {
    this.logger.warn(
      `project=${projectId} action=${actionName} status=error error="${error}"`,
    );
  }
}
