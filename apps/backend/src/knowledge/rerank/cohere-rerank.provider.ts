import { Injectable, Logger } from '@nestjs/common';
import { postJson } from '../../external/llm/llm-http';
import type {
  RerankDocument,
  RerankProvider,
  RerankResult,
} from './rerank-provider.interface';

interface CohereRerankResponse {
  results: Array<{
    index: number;
    relevance_score: number;
  }>;
}

@Injectable()
export class CohereRerankProvider implements RerankProvider {
  private readonly logger = new Logger(CohereRerankProvider.name);

  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly model: string,
  ) {}

  isEnabled(): boolean {
    return true;
  }

  async rerank(
    query: string,
    documents: RerankDocument[],
    topN: number,
  ): Promise<RerankResult[]> {
    if (documents.length === 0) {
      return [];
    }

    const url = 'https://api.cohere.com/v1/rerank';
    const data = await postJson<CohereRerankResponse>(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: this.model,
        query,
        documents: documents.map((document) => document.text),
        top_n: Math.min(topN, documents.length),
        return_documents: false,
      },
      timeoutMs: this.timeoutMs,
    });

    const results = data.results
      .map((entry) => {
        const document = documents[entry.index];
        if (!document) {
          return null;
        }
        return {
          id: document.id,
          score: entry.relevance_score,
        };
      })
      .filter((entry): entry is RerankResult => entry !== null);

    if (results.length === 0) {
      this.logger.warn('Cohere rerank returned no results; keeping hybrid order');
      return documents.slice(0, topN).map((document, index) => ({
        id: document.id,
        score: Math.max(0, 1 - index * 0.001),
      }));
    }

    return results;
  }
}
