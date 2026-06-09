import { Injectable } from '@nestjs/common';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';
import { RagRetrievalService } from './rag-retrieval.service';

/** Fixed reply when QA intent matches but RAG returns no citations (no LLM call). */
export const QA_NO_CITATIONS_REPLY =
  "I don't have documentation that answers that yet. I can help with features documented for this app or in-app actions — try rephrasing or ask about a specific screen.";

@Injectable()
export class QaRunnerService {
  constructor(private readonly retrieval: RagRetrievalService) {}

  async buildPromptContext(
    projectId: string,
    userMessage: string,
  ): Promise<{ modeNote: string; citations: QaSourceCitation[] }> {
    const { contextBlock, citations } = await this.retrieval.retrieve(
      projectId,
      userMessage,
    );

    if (citations.length === 0) {
      return {
        citations: [],
        modeNote:
          'The user is asking a knowledge question. No project documentation matched this query. Do not answer from general world knowledge. Say you can only help with this app, its documentation (when available), or in-app actions. Suggest rephrasing or ask what they want to do in the app.',
      };
    }

    return {
      citations,
      modeNote: [
        'The user is asking a knowledge question. Answer using ONLY the retrieved documentation below when possible.',
        'If the documentation does not contain the answer, say so clearly.',
        'Reference source titles when helpful.',
        '',
        '--- Retrieved knowledge ---',
        contextBlock,
        '--- End retrieved knowledge ---',
      ].join('\n'),
    };
  }
}
