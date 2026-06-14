import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import { SitemapCrawlService } from './sitemap-crawl.service';
import { KnowledgeStorageService } from './knowledge-storage.service';
import { DocumentTextExtractor } from './document-text.extractor';
import { EMBEDDING_PROVIDER } from './embedding/embedding-provider.interface';
import { KnowledgeSource } from './schemas/knowledge-source.schema';
import { KnowledgeChunk } from './schemas/knowledge-chunk.schema';

describe('KnowledgeIngestService', () => {
  let service: KnowledgeIngestService;

  const sourceSave = jest.fn().mockResolvedValue(undefined);
  const chunkDeleteMany = jest.fn().mockResolvedValue(undefined);
  const parentId = new Types.ObjectId();

  const sourceDoc = {
    _id: 'source-1',
    projectId: 'project-1',
    type: 'text',
    title: 'Notes',
    status: 'pending',
    chunkCount: 0,
    save: sourceSave,
  };

  const sourceModel = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(sourceDoc),
    }),
  };

  const chunkCreate = jest.fn().mockImplementation(async (doc) => ({
    _id: doc.kind === 'parent' ? parentId : new Types.ObjectId(),
    ...doc,
  }));

  const chunkModel = {
    deleteMany: chunkDeleteMany,
    create: chunkCreate,
  };

  const embeddings = {
    embedBatch: jest.fn().mockResolvedValue([[0.1, 0.2]]),
  };

  const storage = {
    read: jest.fn(),
  };

  const sitemapCrawl = {
    crawlSitemap: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    sourceDoc.status = 'pending';
    sourceDoc.chunkCount = 0;
    sourceSave.mockResolvedValue(undefined);
    sourceModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(sourceDoc),
    });
    embeddings.embedBatch.mockResolvedValue([[0.1, 0.2]]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        KnowledgeIngestService,
        DocumentTextExtractor,
        { provide: getModelToken(KnowledgeSource.name), useValue: sourceModel },
        { provide: getModelToken(KnowledgeChunk.name), useValue: chunkModel },
        { provide: EMBEDDING_PROVIDER, useValue: embeddings },
        { provide: KnowledgeStorageService, useValue: storage },
        { provide: SitemapCrawlService, useValue: sitemapCrawl },
      ],
    }).compile();

    service = moduleRef.get(KnowledgeIngestService);
  });

  it('processIngestJob indexes text content and marks source ready', async () => {
    await service.processIngestJob({
      sourceId: 'source-1',
      projectId: 'project-1',
      content: 'Hello knowledge base',
    });

    expect(sourceDoc.status).toBe('ready');
    expect(sourceDoc.chunkCount).toBe(1);
    expect(embeddings.embedBatch).toHaveBeenCalledWith(['Hello knowledge base']);
    expect(chunkCreate).toHaveBeenCalledTimes(2);
    expect(chunkCreate.mock.calls[0]?.[0]).toMatchObject({ kind: 'parent' });
    expect(chunkCreate.mock.calls[1]?.[0]).toMatchObject({
      kind: 'child',
      parentChunkId: parentId,
    });
  });

  it('processIngestJob marks source error for missing text content', async () => {
    await service.processIngestJob({
      sourceId: 'source-1',
      projectId: 'project-1',
    });

    expect(sourceDoc.status).toBe('error');
    expect(sourceDoc.errorMessage).toContain('recreate the source');
    expect(embeddings.embedBatch).not.toHaveBeenCalled();
  });

  it('processIngestJob uses persisted textContent when job content is omitted', async () => {
    sourceDoc.textContent = 'Persisted notes';

    await service.processIngestJob({
      sourceId: 'source-1',
      projectId: 'project-1',
    });

    expect(sourceDoc.status).toBe('ready');
    expect(embeddings.embedBatch).toHaveBeenCalledWith(['Persisted notes']);
  });

  it('processIngestJob rethrows retryable embedding failures', async () => {
    embeddings.embedBatch.mockRejectedValue(new Error('OpenAI unavailable'));

    await expect(
      service.processIngestJob({
        sourceId: 'source-1',
        projectId: 'project-1',
        content: 'Retry me',
      }),
    ).rejects.toThrow('OpenAI unavailable');

    expect(sourceDoc.status).toBe('indexing');
  });

  it('markIngestErrorById persists error state', async () => {
    await service.markIngestErrorById(
      'project-1',
      'source-1',
      new BadRequestException('bad source'),
    );

    expect(sourceDoc.status).toBe('error');
    expect(sourceDoc.errorMessage).toContain('bad source');
  });

  it('ingestUploadedFile stores page metadata for PDF pages', async () => {
    sourceDoc.type = 'document';
    embeddings.embedBatch.mockResolvedValue([[0.1, 0.2], [0.3, 0.4]]);

    const documentText = {
      extractDocument: jest.fn().mockResolvedValue({
        text: 'Page one text.\n\nPage two text.',
        pages: [
          { page: 1, text: 'Page one text.' },
          { page: 2, text: 'Page two text.' },
        ],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        KnowledgeIngestService,
        { provide: DocumentTextExtractor, useValue: documentText },
        { provide: getModelToken(KnowledgeSource.name), useValue: sourceModel },
        { provide: getModelToken(KnowledgeChunk.name), useValue: chunkModel },
        { provide: EMBEDDING_PROVIDER, useValue: embeddings },
        { provide: KnowledgeStorageService, useValue: storage },
        { provide: SitemapCrawlService, useValue: sitemapCrawl },
      ],
    }).compile();

    const pdfService = moduleRef.get(KnowledgeIngestService);

    await pdfService.ingestUploadedFile(sourceDoc as never, {
      buffer: Buffer.from('%PDF'),
      mimeType: 'application/pdf',
      originalFilename: 'manual.pdf',
    });

    expect(sourceDoc.status).toBe('ready');
    expect(chunkCreate.mock.calls.some((call) => call[0]?.metadata?.page === 1)).toBe(
      true,
    );
    expect(chunkCreate.mock.calls.some((call) => call[0]?.metadata?.page === 2)).toBe(
      true,
    );
  });
});
