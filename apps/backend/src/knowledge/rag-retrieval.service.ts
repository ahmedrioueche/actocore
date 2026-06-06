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
import {
  normalizeKnowledgeText,
  truncateKnowledgeExcerpt,
} from './utils/normalize-knowledge-text';
import { cosineSimilarity } from './utils/vector-math';

export interface RagRetrievalResult {
  contextBlock: string;
  citations: QaSourceCitation[];
}

const DEFAULT_TOP_K = 4;
const MAX_CITATIONS = 2;
const MIN_SCORE = 0.12;
const MIN_RELATIVE_TO_TOP = 0.55;
const EXCERPT_MAX_CHARS = 360;

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

    if (ranked.length === 0) {
      return { contextBlock: '', citations: [] };
    }

    const topScore = ranked[0].score;
    const citationCandidates = ranked.filter(
      ({ score }) => score >= topScore * MIN_RELATIVE_TO_TOP,
    );

    const citations = dedupeCitationsBySource(
      citationCandidates.map(({ chunk, score }) => ({
        sourceId: chunk.sourceId.toString(),
        sourceTitle: chunk.sourceTitle,
        chunkIndex: chunk.chunkIndex,
        excerpt: truncateKnowledgeExcerpt(chunk.content, EXCERPT_MAX_CHARS),
        score: Number(score.toFixed(4)),
      })),
    ).slice(0, MAX_CITATIONS);

    const contextBlock = ranked
      .map(
        ({ chunk }, i) =>
          `[${i + 1}] ${chunk.sourceTitle} (chunk ${chunk.chunkIndex})\n${normalizeKnowledgeText(chunk.content)}`,
      )
      .join('\n\n');

    return { contextBlock, citations };
  }
}

function dedupeCitationsBySource(
  citations: QaSourceCitation[],
): QaSourceCitation[] {
  const bySource = new Map<string, QaSourceCitation>();

  for (const citation of citations) {
    const existing = bySource.get(citation.sourceId);
    if (!existing || citation.score > existing.score) {
      bySource.set(citation.sourceId, citation);
    }
  }

  return [...bySource.values()].sort((a, b) => b.score - a.score);
}
