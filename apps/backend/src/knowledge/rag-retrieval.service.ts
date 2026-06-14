import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { QaSourceCitation } from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './embedding/embedding-provider.interface';
import {
  RERANK_PROVIDER,
  type RerankProvider,
} from './rerank/rerank-provider.interface';
import type {
  RagEmptyReason,
  RagRankedHit,
  RagRetrievalLog,
  RagRetrievalOptions,
  RagRetrievalResult,
} from './rag-retrieval.types';
import { RAG_RETRIEVAL_LOG_CHUNK_LIMIT } from './rag-retrieval.types';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import {
  applyContextTokenBudget,
  readContextMaxTokens,
  type RagContextPartCandidate,
} from './utils/rag-context-budget.util';
import {
  keywordScore,
  readHybridKeywordWeight,
} from './utils/keyword-score.util';
import {
  normalizeKnowledgeText,
  truncateKnowledgeExcerpt,
} from './utils/normalize-knowledge-text';
import { cosineSimilarity } from './utils/vector-math';
import {
  applyPageBoostScore,
  readPageBoostWeight,
} from './utils/rag-page-boost.util';

export type { RagRetrievalLog, RagRetrievalOptions, RagRetrievalResult } from './rag-retrieval.types';

type RankedChunk = {
  chunk: KnowledgeChunkDocument;
  vectorScore: number;
  kwScore: number;
  score: number;
};

const DEFAULT_TOP_K = readPositiveInt(process.env.RAG_TOP_K, 4);
const DEFAULT_CANDIDATE_K = readPositiveInt(process.env.RAG_CANDIDATE_K, 20);
const MAX_CITATIONS = 2;
const MIN_VECTOR_SCORE = readScore(process.env.RAG_MIN_SCORE, 0.12);
const MIN_KEYWORD_SCORE = readScore(process.env.RAG_MIN_KEYWORD_SCORE, 0.5);
const MIN_RELATIVE_TO_TOP = 0.55;
const EXCERPT_MAX_CHARS = 360;

@Injectable()
export class RagRetrievalService {
  private readonly logger = new Logger(RagRetrievalService.name);

  constructor(
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddings: EmbeddingProvider,
    @Inject(RERANK_PROVIDER)
    private readonly reranker: RerankProvider,
  ) {}

  async retrieve(
    projectId: string,
    query: string,
    topK = DEFAULT_TOP_K,
    options?: RagRetrievalOptions,
  ): Promise<RagRetrievalResult> {
    const chunks = await this.chunkModel
      .find(withProjectId(projectId, { kind: { $ne: 'parent' as const } }))
      .exec();

    if (chunks.length === 0) {
      return emptyResult('no_chunks', 0, undefined, options);
    }

    const queryEmbedding = await this.embeddings.embed(query);
    const keywordWeight = readHybridKeywordWeight();
    const vectorWeight = 1 - keywordWeight;
    const candidateLimit = Math.max(topK, DEFAULT_CANDIDATE_K);
    const currentPageId = options?.currentPageId?.trim();
    const pageBoostWeight = readPageBoostWeight();

    const candidates = chunks
      .map((chunk) => {
        const vectorScore = cosineSimilarity(
          queryEmbedding,
          chunk.embedding ?? [],
        );
        const kwScore = keywordScore(query, chunk.content);
        const baseScore = vectorWeight * vectorScore + keywordWeight * kwScore;
        const score = applyPageBoostScore(
          baseScore,
          chunk.metadata?.pageIds,
          currentPageId,
          pageBoostWeight,
        );
        return { chunk, vectorScore, kwScore, score };
      })
      .filter(
        (entry) =>
          entry.vectorScore >= MIN_VECTOR_SCORE ||
          entry.kwScore >= MIN_KEYWORD_SCORE,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, candidateLimit);

    const retrievalLogBase = buildRetrievalLogBase(candidates);

    if (candidates.length === 0) {
      return emptyResult('no_candidates', 0, retrievalLogBase, options);
    }

    const ranked = await this.applyRerank(query, candidates, topK);
    const rankedHits = toRankedHits(ranked, topK);
    const topScore = ranked[0]?.score ?? 0;

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

    if (citations.length === 0) {
      return emptyResult(
        'below_threshold',
        candidates.length,
        {
          ...retrievalLogBase,
          topScore,
          chunks: toLogChunks(ranked),
        },
        options,
        rankedHits,
      );
    }

    const { contextBlock, droppedByBudget, contextPartCount } =
      await this.buildContextBlock(ranked.slice(0, topK));

    const retrievalLog: RagRetrievalLog = {
      ...retrievalLogBase,
      topScore,
      contextPartCount,
      chunks: toLogChunks(ranked),
      ...retrievalOptionsToLog(options),
    };

    if (!contextBlock) {
      return emptyResult(
        'context_budget_exceeded',
        candidates.length,
        retrievalLog,
        options,
        rankedHits,
      );
    }

    return { contextBlock, citations, retrievalLog, rankedHits };
  }

  private async buildContextBlock(ranked: RankedChunk[]): Promise<{
    contextBlock: string;
    droppedByBudget: boolean;
    contextPartCount: number;
  }> {
    const parentIds = [
      ...new Set(
        ranked
          .map(({ chunk }) => chunk.parentChunkId?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const parents =
      parentIds.length > 0
        ? await this.chunkModel
            .find({ _id: { $in: parentIds.map((id) => new Types.ObjectId(id)) } })
            .exec()
        : [];

    const parentById = new Map(
      parents.map((parent) => [parent._id.toString(), parent]),
    );

    const seenParents = new Set<string>();
    const partCandidates: RagContextPartCandidate[] = [];

    for (const { chunk, score } of ranked) {
      const parentId = chunk.parentChunkId?.toString();

      if (parentId) {
        const parent = parentById.get(parentId);
        if (parent && !seenParents.has(parentId)) {
          seenParents.add(parentId);
          partCandidates.push({
            score,
            chunkId: parent._id.toString(),
            sourceId: parent.sourceId.toString(),
            format: (index) => formatContextFromParent(parent, index),
          });
          continue;
        }
        if (parent) {
          continue;
        }
      }

      partCandidates.push({
        score,
        chunkId: chunk._id.toString(),
        sourceId: chunk.sourceId.toString(),
        format: (index) => formatContextChunk(chunk, index),
      });
    }

    const { parts, droppedByBudget } = applyContextTokenBudget(
      partCandidates,
      readContextMaxTokens(),
    );

    return {
      contextBlock: parts.join('\n\n'),
      droppedByBudget,
      contextPartCount: parts.length,
    };
  }

  private async applyRerank(
    query: string,
    candidates: RankedChunk[],
    topK: number,
  ): Promise<RankedChunk[]> {
    if (!this.reranker.isEnabled() || candidates.length <= 1) {
      return candidates;
    }

    try {
      const reranked = await this.reranker.rerank(
        query,
        candidates.map(({ chunk }) => ({
          id: chunk._id.toString(),
          text: chunk.content,
        })),
        topK,
      );

      const byId = new Map(
        candidates.map((entry) => [entry.chunk._id.toString(), entry]),
      );

      const ordered = reranked
        .map(({ id, score }) => {
          const entry = byId.get(id);
          return entry ? { ...entry, score } : null;
        })
        .filter((entry): entry is RankedChunk => entry !== null);

      if (ordered.length === 0) {
        return candidates;
      }

      const seen = new Set(ordered.map((entry) => entry.chunk._id.toString()));
      const remainder = candidates.filter(
        (entry) => !seen.has(entry.chunk._id.toString()),
      );

      return [...ordered, ...remainder];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rerank failed, using hybrid order: ${message}`);
      return candidates;
    }
  }
}

function emptyResult(
  emptyReason: RagEmptyReason,
  candidateCount: number,
  partial?: Partial<RagRetrievalLog>,
  options?: RagRetrievalOptions,
  rankedHits: RagRankedHit[] = [],
): RagRetrievalResult {
  return {
    contextBlock: '',
    citations: [],
    emptyReason,
    rankedHits,
    retrievalLog: {
      candidateCount,
      contextPartCount: 0,
      chunks: [],
      emptyReason,
      ...partial,
      ...retrievalOptionsToLog(options),
    },
  };
}

function retrievalOptionsToLog(
  options?: RagRetrievalOptions,
): Pick<RagRetrievalLog, 'currentPageId' | 'pageBoostWeight'> {
  const currentPageId = options?.currentPageId?.trim();
  if (!currentPageId) {
    return {};
  }

  return {
    currentPageId,
    pageBoostWeight: readPageBoostWeight(),
  };
}

function buildRetrievalLogBase(
  candidates: RankedChunk[],
): Pick<RagRetrievalLog, 'candidateCount' | 'contextPartCount' | 'chunks'> {
  return {
    candidateCount: candidates.length,
    contextPartCount: 0,
    chunks: toLogChunks(candidates),
  };
}

function toLogChunks(ranked: RankedChunk[]): RagRetrievalLog['chunks'] {
  return ranked.slice(0, RAG_RETRIEVAL_LOG_CHUNK_LIMIT).map(({ chunk, score }) => ({
    chunkId: chunk._id.toString(),
    sourceId: chunk.sourceId.toString(),
    score: Number(score.toFixed(4)),
  }));
}

function toRankedHits(ranked: RankedChunk[], topK: number): RagRankedHit[] {
  return ranked.slice(0, topK).map(({ chunk, score }) => ({
    chunkId: chunk._id.toString(),
    sourceId: chunk.sourceId.toString(),
    score: Number(score.toFixed(4)),
    content: chunk.content,
  }));
}

function formatContextFromParent(
  parent: KnowledgeChunkDocument,
  index: number,
): string {
  const heading =
    parent.metadata?.headingPath?.length &&
    parent.metadata.headingPath.length > 0
      ? ` > ${parent.metadata.headingPath.join(' > ')}`
      : '';
  const page = formatPageSuffix(parent.metadata);
  const pageUrl = formatPageUrlSuffix(parent.metadata);

  return `[${index + 1}] ${parent.sourceTitle}${heading}${page}${pageUrl} (section ${parent.chunkIndex + 1})\n${normalizeKnowledgeText(parent.content)}`;
}

function formatContextChunk(
  chunk: KnowledgeChunkDocument,
  index: number,
): string {
  const heading =
    chunk.metadata?.headingPath?.length &&
    chunk.metadata.headingPath.length > 0
      ? ` > ${chunk.metadata.headingPath.join(' > ')}`
      : '';
  const page = formatPageSuffix(chunk.metadata);
  const pageUrl = formatPageUrlSuffix(chunk.metadata);

  return `[${index + 1}] ${chunk.sourceTitle}${heading}${page}${pageUrl} (chunk ${chunk.chunkIndex})\n${normalizeKnowledgeText(chunk.content)}`;
}

function formatPageUrlSuffix(
  metadata?: KnowledgeChunkDocument['metadata'],
): string {
  if (metadata?.pageUrl) {
    return ` (${metadata.pageUrl})`;
  }

  return '';
}

function formatPageSuffix(
  metadata?: KnowledgeChunkDocument['metadata'],
): string {
  if (metadata?.page !== undefined && metadata.page > 0) {
    return ` (p. ${metadata.page})`;
  }

  return '';
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

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readScore(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
