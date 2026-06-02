import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './embedding/embedding-provider.interface';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import { cosineSimilarity } from './utils/vector-math';

export interface RagRetrievalResult {
  contextBlock: string;
  citations: QaSourceCitation[];
}

const DEFAULT_TOP_K = 4;
const MIN_SCORE = 0.05;

@Injectable()
export class RagRetrievalService {
  constructor(
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddings: EmbeddingProvider,
  ) {}

  async retrieve(
    projectId: string,
    query: string,
    topK = DEFAULT_TOP_K,
  ): Promise<RagRetrievalResult> {
    const chunks = await this.chunkModel
      .find(withProjectId(projectId))
      .exec();

    if (chunks.length === 0) {
      return { contextBlock: '', citations: [] };
    }

    const queryEmbedding = await this.embeddings.embed(query);

    const ranked = chunks
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .filter((entry) => entry.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const citations: QaSourceCitation[] = ranked.map(({ chunk, score }) => ({
      sourceId: chunk.sourceId.toString(),
      sourceTitle: chunk.sourceTitle,
      chunkIndex: chunk.chunkIndex,
      excerpt: truncate(chunk.content, 240),
      score: Number(score.toFixed(4)),
    }));

    const contextBlock = ranked
      .map(
        ({ chunk }, i) =>
          `[${i + 1}] ${chunk.sourceTitle} (chunk ${chunk.chunkIndex})\n${chunk.content}`,
      )
      .join('\n\n');

    return { contextBlock, citations };
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}
