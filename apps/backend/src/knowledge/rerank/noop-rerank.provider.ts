import { Injectable } from '@nestjs/common';
import type {
  RerankDocument,
  RerankProvider,
  RerankResult,
} from './rerank-provider.interface';

@Injectable()
export class NoopRerankProvider implements RerankProvider {
  isEnabled(): boolean {
    return false;
  }

  async rerank(
    _query: string,
    documents: RerankDocument[],
    topN: number,
  ): Promise<RerankResult[]> {
    return documents.slice(0, topN).map((document, index) => ({
      id: document.id,
      score: Math.max(0, 1 - index * 0.001),
    }));
  }
}
