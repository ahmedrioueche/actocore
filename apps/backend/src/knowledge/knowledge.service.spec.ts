import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service';
import { AppPagesService } from '../actions/app-pages.service';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import { KnowledgeIngestQueueService } from './knowledge-ingest.queue.service';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeStorageService } from './knowledge-storage.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { KnowledgeSource } from './schemas/knowledge-source.schema';
import { KnowledgeChunk } from './schemas/knowledge-chunk.schema';

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  const projectId = 'project-1';
  const sourceId = new Types.ObjectId();

  const sourceDoc = {
    _id: sourceId,
    projectId,
    type: 'text',
    title: 'Notes',
    textContent: 'Hello knowledge base',
    status: 'ready',
    chunkCount: 2,
    save: jest.fn().mockResolvedValue(undefined),
  };

  const sourceModel = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(sourceDoc),
    }),
  };

  const chunkDeleteMany = jest.fn().mockResolvedValue(undefined);
  const chunkUpdateMany = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(undefined),
  });
  const chunkModel = { deleteMany: chunkDeleteMany, updateMany: chunkUpdateMany };

  const projects = { assertExists: jest.fn().mockResolvedValue(undefined) };
  const ingest = { processIngestJob: jest.fn().mockResolvedValue(undefined) };
  const ingestQueue = {
    isEnabled: jest.fn().mockReturnValue(false),
    enqueue: jest.fn().mockResolvedValue(undefined),
  };
  const storage = {};
  const config = { getOrThrow: jest.fn() };
  const appPages = { require: jest.fn().mockResolvedValue({}) };
  const retrieval = { retrieve: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    sourceDoc.status = 'ready';
    sourceDoc.chunkCount = 2;
    sourceDoc.textContent = 'Hello knowledge base';
    sourceModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(sourceDoc),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: getModelToken(KnowledgeSource.name), useValue: sourceModel },
        { provide: getModelToken(KnowledgeChunk.name), useValue: chunkModel },
        { provide: ProjectsService, useValue: projects },
        { provide: KnowledgeIngestService, useValue: ingest },
        { provide: KnowledgeIngestQueueService, useValue: ingestQueue },
        { provide: KnowledgeStorageService, useValue: storage },
        { provide: ConfigService, useValue: config },
        { provide: AppPagesService, useValue: appPages },
        { provide: RagRetrievalService, useValue: retrieval },
      ],
    }).compile();

    service = moduleRef.get(KnowledgeService);
  });

  it('reindexes a ready text source synchronously when queue is disabled', async () => {
    sourceDoc.status = 'ready';
    sourceModel.findOne
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(sourceDoc),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          ...sourceDoc,
          status: 'ready',
          chunkCount: 1,
        }),
      });

    const result = await service.reindex(projectId, sourceId.toString());

    expect(chunkDeleteMany).toHaveBeenCalledWith({
      projectId,
      sourceId,
    });
    expect(ingest.processIngestJob).toHaveBeenCalledWith({
      sourceId: sourceId.toString(),
      projectId,
      content: 'Hello knowledge base',
    });
    expect(result.chunkCount).toBe(1);
  });

  it('enqueues reindex when async ingest is enabled', async () => {
    ingestQueue.isEnabled.mockReturnValue(true);

    const result = await service.reindex(projectId, sourceId.toString());

    expect(ingestQueue.enqueue).toHaveBeenCalledWith(
      {
        sourceId: sourceId.toString(),
        projectId,
        content: 'Hello knowledge base',
      },
      { replace: true },
    );
    expect(ingest.processIngestJob).not.toHaveBeenCalled();
    expect(result.status).toBe('indexing');
  });

  it('rejects reindex when source is already indexing', async () => {
    sourceDoc.status = 'indexing';

    await expect(
      service.reindex(projectId, sourceId.toString()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reindex for text sources without stored content', async () => {
    sourceDoc.textContent = undefined;

    await expect(
      service.reindex(projectId, sourceId.toString()),
    ).rejects.toThrow('no stored content');
  });
});
