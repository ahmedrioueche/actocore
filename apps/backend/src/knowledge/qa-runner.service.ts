import { Injectable } from '@nestjs/common';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';
import type { RagRetrievalLog, RagRetrievalOptions } from './rag-retrieval.types';
import { RagQueryRewriteService } from './rag-query-rewrite.service';
import { RagRetrievalService } from './rag-retrieval.service';

/** Fixed reply when QA intent matches but RAG returns no citations (no LLM call). */
export const QA_NO_CITATIONS_REPLY =
  "I don't have documentation that answers that yet. I can help with features documented for this app or in-app actions — try rephrasing or ask about a specific screen.";

export interface QaPromptContextOptions {
  sessionId?: string;
  currentPageId?: string;
  currentPageTitle?: string;
}

@Injectable()
export class QaRunnerService {
  constructor(
    private readonly retrieval: RagRetrievalService,
    private readonly queryRewrite: RagQueryRewriteService,
  ) {}

  async buildPromptContext(
    projectId: string,
    userMessage: string,
    options?: QaPromptContextOptions,
  ): Promise<{
    modeNote: string;
    citations: QaSourceCitation[];
    retrievalLog: RagRetrievalLog;
  }> {
    const { searchQuery, rewritten } = await this.queryRewrite.rewrite(
      userMessage,
      { sessionId: options?.sessionId },
    );

    const retrievalOptions: RagRetrievalOptions | undefined =
      options?.currentPageId?.trim()
        ? { currentPageId: options.currentPageId.trim() }
        : undefined;

    const result = await this.retrieval.retrieve(
      projectId,
      searchQuery,
      undefined,
      retrievalOptions,
    );
    const retrievalLog: RagRetrievalLog = {
      ...result.retrievalLog,
      originalQuery: userMessage,
      searchQuery,
      queryRewritten: rewritten,
    };

    const { contextBlock, citations } = result;

    if (citations.length === 0 || !contextBlock) {
      return {
        citations: [],
        retrievalLog,
        modeNote:
          'The user is asking a knowledge question. No project documentation matched this query. Do not answer from general world knowledge. Say you can only help with this app, its documentation (when available), or in-app actions. Suggest rephrasing or ask what they want to do in the app.',
      };
    }

    const pagePreference = options?.currentPageTitle?.trim()
      ? `The user is on the "${options.currentPageTitle.trim()}" screen. Prefer page-scoped documentation for this screen when it is relevant to the question.`
      : options?.currentPageId?.trim()
        ? 'Prefer documentation scoped to the current app page when it is relevant to the question.'
        : null;

    return {
      citations,
      retrievalLog,
      modeNote: [
        'The user is asking a knowledge question. Answer using ONLY the retrieved documentation below when possible.',
        'If the documentation does not contain the answer, say so clearly.',
        'When you use retrieved documentation, cite inline using [1], [2], etc. matching the numbered blocks below.',
        'When the user asks for a list (for example "list all", "what are all"), include every matching item from the retrieved documentation — do not summarize down to a single example.',
        ...(pagePreference ? [pagePreference] : []),
        '',
        '--- Retrieved knowledge ---',
        contextBlock,
        '--- End retrieved knowledge ---',
      ].join('\n'),
    };
  }
}
