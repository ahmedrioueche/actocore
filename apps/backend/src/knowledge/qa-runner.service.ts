import { Injectable } from '@nestjs/common';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';
import { RagRetrievalService } from './rag-retrieval.service';

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
          'The user is asking a knowledge question. No project documentation matched this query. Answer clearly from general knowledge and mention that no knowledge base excerpts were found.',
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
