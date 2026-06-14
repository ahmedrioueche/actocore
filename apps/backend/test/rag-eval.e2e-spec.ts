import { getModelToken } from '@nestjs/mongoose';
import { NestFactory } from '@nestjs/core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model, Types } from 'mongoose';
import { RagEvalModule } from '../src/knowledge/rag-eval.module';
import { RagRetrievalService } from '../src/knowledge/rag-retrieval.service';
import { StubEmbeddingProvider } from '../src/knowledge/embedding/stub-embedding.provider';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from '../src/knowledge/schemas/knowledge-chunk.schema';
import {
  RAG_EVAL_CI_THRESHOLDS,
  assertEvalReportMeetsThresholds,
  runRagEval,
} from '../src/knowledge/utils/rag-eval.util';

const CI_SEED_CHUNKS = [
  'ActoCore is an AI integration layer for applications.',
  'Use error code ERR-404 when a workspace is missing.',
];

describe('RAG eval (e2e)', () => {
  let mongod: MongoMemoryServer;
  const projectId = new Types.ObjectId().toString();
  const sourceId = new Types.ObjectId();
  const stubEmbeddings = new StubEmbeddingProvider();

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.EMBEDDING_PROVIDER = 'stub';
    process.env.RERANK_PROVIDER = 'none';
    delete process.env.REDIS_URL;

    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  });

  afterAll(async () => {
    await mongod.stop();
  });

  it('meets recall thresholds on seeded knowledge with stub embeddings', async () => {
    const app = await NestFactory.createApplicationContext(RagEvalModule, {
      logger: ['error', 'warn'],
    });

    try {
      const chunkModel = app.get<Model<KnowledgeChunkDocument>>(
        getModelToken(KnowledgeChunk.name),
      );

      for (const [index, content] of CI_SEED_CHUNKS.entries()) {
        await chunkModel.create({
          projectId,
          sourceId,
          sourceTitle: 'RAG eval seed',
          chunkIndex: index,
          kind: 'child',
          content,
          embedding: await stubEmbeddings.embed(content),
        });
      }

      const retrieval = app.get(RagRetrievalService);
      const report = await runRagEval({
        retrieval,
        projectId,
        topK: 4,
        fixturePath: 'ci-seed',
        fixture: {
          name: 'ci-seed',
          cases: [
            {
              query: 'What is ActoCore?',
              expectedSourceIds: [sourceId.toString()],
              expectedKeywords: ['ActoCore'],
            },
            {
              query: 'ERR-404 workspace missing',
              expectedSourceIds: [sourceId.toString()],
              expectedKeywords: ['ERR-404'],
            },
          ],
        },
      });

      assertEvalReportMeetsThresholds(report, RAG_EVAL_CI_THRESHOLDS);
    } finally {
      await app.close();
    }
  });
});
