import { Injectable, Logger } from '@nestjs/common';
import type { ChatIntent } from '@ahmedrioueche/actocore-shared';
import type { RagRetrievalLog } from '../knowledge/rag-retrieval.types';

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
  ragRetrieval?: RagRetrievalLog;
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
    if (entry.ragRetrieval) {
      parts.push(formatRagRetrieval(entry.ragRetrieval));
    }

    this.logger.log(parts.join(' '));
  }

  logActionFailure(projectId: string, actionName: string, error: string): void {
    this.logger.warn(
      `project=${projectId} action=${actionName} status=error error="${error}"`,
    );
  }
}

function formatRagRetrieval(log: RagRetrievalLog): string {
  const segments = [
    `ragCandidates=${log.candidateCount}`,
    `ragContextParts=${log.contextPartCount}`,
  ];

  if (log.topScore !== undefined) {
    segments.push(`ragTopScore=${log.topScore}`);
  }
  if (log.emptyReason) {
    segments.push(`ragEmpty=${log.emptyReason}`);
  }
  if (log.queryRewritten && log.searchQuery) {
    segments.push(`ragSearchQuery=${JSON.stringify(log.searchQuery)}`);
  }
  if (log.chunks.length > 0) {
    const chunkSummary = log.chunks
      .map((chunk) => `${chunk.chunkId}:${chunk.score}`)
      .join(',');
    segments.push(`ragChunks=${chunkSummary}`);
  }

  return segments.join(' ');
}
