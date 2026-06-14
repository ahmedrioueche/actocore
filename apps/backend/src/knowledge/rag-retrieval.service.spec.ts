import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { EMBEDDING_PROVIDER } from './embedding/embedding-provider.interface';
import { StubEmbeddingProvider } from './embedding/stub-embedding.provider';
import { NoopRerankProvider } from './rerank/noop-rerank.provider';
import { RERANK_PROVIDER } from './rerank/rerank-provider.interface';
import { KnowledgeChunk } from './schemas/knowledge-chunk.schema';
import { RagRetrievalService } from './rag-retrieval.service';

describe('RagRetrievalService', () => {
  const projectId = new Types.ObjectId().toString();
  const sourceId = new Types.ObjectId();

  const chunks = [
    {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Docs',
      chunkIndex: 0,
      content: 'ActoCore is an AI integration layer for applications.',
      embedding: [] as number[],
    },
    {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Docs',
      chunkIndex: 1,
      content: 'Unrelated content about cooking recipes.',
      embedding: [] as number[],
    },
  ];

  const stubEmbeddings = new StubEmbeddingProvider();
  const noopRerank = new NoopRerankProvider();

  beforeAll(async () => {
    for (const chunk of chunks) {
      chunk.embedding = await stubEmbeddings.embed(chunk.content);
    }
  });

  function createChunkModel(initialChunks: Array<Record<string, unknown>>) {
    const parents = new Map<string, Record<string, unknown>>();

    return {
      find: jest.fn((filter: Record<string, unknown>) => ({
        exec: async () => {
          if (filter._id) {
            const ids = (filter._id as { $in: Types.ObjectId[] }).$in.map((id) =>
              id.toString(),
            );
            return ids
              .map((id) => parents.get(id))
              .filter((chunk): chunk is Record<string, unknown> => Boolean(chunk));
          }

          return initialChunks.filter(
            (chunk) => chunk.kind === 'child' || chunk.kind === undefined,
          );
        },
      })),
      registerParent(parent: Record<string, unknown>) {
        parents.set((parent._id as Types.ObjectId).toString(), parent);
      },
    };
  }

  function createModule(
    chunkModel: ReturnType<typeof createChunkModel>,
    reranker = noopRerank,
  ) {
    return Test.createTestingModule({
      providers: [
        RagRetrievalService,
        { provide: getModelToken(KnowledgeChunk.name), useValue: chunkModel },
        { provide: EMBEDDING_PROVIDER, useValue: stubEmbeddings },
        { provide: RERANK_PROVIDER, useValue: reranker },
      ],
    }).compile();
  }

  it('retrieves relevant chunks for a query', async () => {
    const chunkModel = createChunkModel(chunks);

    const module = await createModule(chunkModel);
    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(projectId, 'What is ActoCore?');

    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].excerpt).toContain('ActoCore');
    expect(result.contextBlock).toContain('ActoCore');
    expect(result.retrievalLog.candidateCount).toBeGreaterThan(0);
    expect(result.retrievalLog.chunks.length).toBeGreaterThan(0);
  });

  it('boosts exact keyword matches via hybrid scoring', async () => {
    const exactMatchChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Billing FAQ',
      chunkIndex: 2,
      content: 'Use error code ERR-404 when a workspace is missing.',
      embedding: await stubEmbeddings.embed(
        'Unrelated vector content about cooking.',
      ),
    };

    const chunkModel = createChunkModel([...chunks, exactMatchChunk]);

    const module = await createModule(chunkModel);
    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(projectId, 'ERR-404 workspace missing');

    expect(result.contextBlock).toContain('ERR-404');
    expect(result.citations[0]?.excerpt).toContain('ERR-404');
  });

  it('reorders hybrid candidates when reranking is enabled', async () => {
    const misleadingChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Docs',
      chunkIndex: 0,
      content: 'Unrelated content about cooking recipes.',
      embedding: await stubEmbeddings.embed('What is ActoCore?'),
    };
    const answerChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Docs',
      chunkIndex: 1,
      content: 'ActoCore is an AI integration layer for applications.',
      embedding: await stubEmbeddings.embed('cooking recipes only'),
    };

    const chunkModel = createChunkModel([misleadingChunk, answerChunk]);

    const reranker = {
      isEnabled: () => true,
      rerank: jest.fn(async (_query, documents, topN) => {
        const preferred = documents.find((document) =>
          document.text.includes('integration layer for applications'),
        );
        return [{ id: preferred!.id, score: 0.99 }].slice(0, topN);
      }),
    };

    const module = await createModule(chunkModel, reranker);
    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(projectId, 'What is ActoCore?');

    expect(result.contextBlock.startsWith('[1] Docs')).toBe(true);
    expect(result.contextBlock).toContain('ActoCore is an AI integration layer');
    expect(reranker.rerank).toHaveBeenCalled();
  });

  it('injects parent section text when a child chunk matches', async () => {
    const parentId = new Types.ObjectId();
    const parentChunk = {
      _id: parentId,
      projectId,
      sourceId,
      sourceTitle: 'Billing FAQ',
      kind: 'parent',
      chunkIndex: 0,
      content: [
        'Refunds are available within 30 days of purchase.',
        'Contact support with your invoice number.',
        'Use error code ERR-404 when a workspace is missing.',
      ].join(' '),
      metadata: { headingPath: ['Billing'] },
    };

    const childChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Billing FAQ',
      kind: 'child',
      parentChunkId: parentId,
      chunkIndex: 2,
      content: 'Use error code ERR-404 when a workspace is missing.',
      embedding: await stubEmbeddings.embed(
        'Use error code ERR-404 when a workspace is missing.',
      ),
      metadata: { headingPath: ['Billing'] },
    };

    const chunkModel = createChunkModel([childChunk]);
    chunkModel.registerParent(parentChunk);

    const module = await createModule(chunkModel);
    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(projectId, 'ERR-404 workspace missing');

    expect(result.contextBlock).toContain('Refunds are available within 30 days');
    expect(result.contextBlock).toContain('Contact support with your invoice number');
    expect(result.citations[0]?.excerpt).toContain('ERR-404');
  });

  it('boosts page-scoped chunks when currentPageId is set', async () => {
    const pageId = new Types.ObjectId().toString();
    const globalChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Global docs',
      chunkIndex: 0,
      content: 'Generic onboarding overview for all screens.',
      embedding: await stubEmbeddings.embed(
        'Generic onboarding overview for all screens.',
      ),
    };
    const pageChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId: new Types.ObjectId(),
      sourceTitle: 'Billing FAQ',
      chunkIndex: 0,
      content: 'Billing refunds are processed within 5 business days.',
      metadata: { pageIds: [pageId] },
      embedding: await stubEmbeddings.embed('How do refunds work on billing?'),
    };

    const chunkModel = createChunkModel([globalChunk, pageChunk]);
    const module = await createModule(chunkModel);
    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(
      projectId,
      'How do refunds work on billing?',
      4,
      { currentPageId: pageId },
    );

    expect(result.contextBlock).toContain('Billing refunds');
    expect(result.retrievalLog.currentPageId).toBe(pageId);
  });

  it('returns no_candidates when nothing passes score thresholds', async () => {
    const weakChunk = {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Docs',
      chunkIndex: 0,
      content: 'completely unrelated gibberish xyz qwerty',
      embedding: await stubEmbeddings.embed('completely unrelated gibberish xyz qwerty'),
    };

    const chunkModel = createChunkModel([weakChunk]);
    const module = await createModule(chunkModel);
    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(
      projectId,
      'ERR-404 workspace missing unique phrase',
    );

    expect(result.citations).toHaveLength(0);
    expect(result.contextBlock).toBe('');
    expect(result.emptyReason).toBe('no_candidates');
    expect(result.retrievalLog.emptyReason).toBe('no_candidates');
  });

  it('returns context_budget_exceeded when parent context exceeds token cap', async () => {
    const originalMax = process.env.RAG_CONTEXT_MAX_TOKENS;
    process.env.RAG_CONTEXT_MAX_TOKENS = '50';

    try {
      const parentId = new Types.ObjectId();
      const parentChunk = {
        _id: parentId,
        projectId,
        sourceId,
        sourceTitle: 'Billing FAQ',
        kind: 'parent',
        chunkIndex: 0,
        content: 'x'.repeat(4000),
        metadata: { headingPath: ['Billing'] },
      };

      const childChunk = {
        _id: new Types.ObjectId(),
        projectId,
        sourceId,
        sourceTitle: 'Billing FAQ',
        kind: 'child',
        parentChunkId: parentId,
        chunkIndex: 0,
        content: 'Use error code ERR-404 when a workspace is missing.',
        embedding: await stubEmbeddings.embed(
          'Use error code ERR-404 when a workspace is missing.',
        ),
      };

      const chunkModel = createChunkModel([childChunk]);
      chunkModel.registerParent(parentChunk);

      const module = await createModule(chunkModel);
      const service = module.get(RagRetrievalService);
      const result = await service.retrieve(projectId, 'ERR-404 workspace missing');

      expect(result.citations).toHaveLength(0);
      expect(result.contextBlock).toBe('');
      expect(result.emptyReason).toBe('context_budget_exceeded');
    } finally {
      if (originalMax === undefined) {
        delete process.env.RAG_CONTEXT_MAX_TOKENS;
      } else {
        process.env.RAG_CONTEXT_MAX_TOKENS = originalMax;
      }
    }
  });
});
