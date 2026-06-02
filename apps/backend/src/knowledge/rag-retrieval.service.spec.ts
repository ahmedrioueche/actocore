import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { EMBEDDING_PROVIDER } from './embedding/embedding-provider.interface';
import { StubEmbeddingProvider } from './embedding/stub-embedding.provider';
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
      embedding: [],
    },
    {
      _id: new Types.ObjectId(),
      projectId,
      sourceId,
      sourceTitle: 'Docs',
      chunkIndex: 1,
      content: 'Unrelated content about cooking recipes.',
      embedding: [],
    },
  ];

  const stubEmbeddings = new StubEmbeddingProvider();

  beforeAll(async () => {
    for (const chunk of chunks) {
      chunk.embedding = await stubEmbeddings.embed(chunk.content);
    }
  });

  it('retrieves relevant chunks for a query', async () => {
    const chunkModel = {
      find: jest.fn(() => ({
        exec: async () => chunks,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagRetrievalService,
        { provide: getModelToken(KnowledgeChunk.name), useValue: chunkModel },
        { provide: EMBEDDING_PROVIDER, useValue: stubEmbeddings },
      ],
    }).compile();

    const service = module.get(RagRetrievalService);
    const result = await service.retrieve(projectId, 'What is ActoCore?');

    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0].excerpt).toContain('ActoCore');
    expect(result.contextBlock).toContain('ActoCore');
  });
});
