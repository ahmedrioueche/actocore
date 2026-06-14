import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateKnowledgeSourceDto,
  KnowledgeSourceType,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { LlmHttpError } from '../external/llm/llm-http';
import type { DocumentExtractionResult } from './document-extraction.types';
import { DocumentTextExtractor } from './document-text.extractor';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from './embedding/embedding-provider.interface';
import type { KnowledgeIngestJobData } from './knowledge-ingest.types';
import { KnowledgeStorageService } from './knowledge-storage.service';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from './schemas/knowledge-source.schema';
import { SitemapCrawlService } from './sitemap-crawl.service';
import { fetchUrlContent } from './url-content.fetcher';
import { chunkTextWithParents, chunkTextWithParentsFromPages } from './utils/text-chunker';
import type { KnowledgeChunkBuildMetadata } from './utils/text-chunker';

export interface KnowledgeUploadedFile {
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
}

@Injectable()
export class KnowledgeIngestService {
  constructor(
    @InjectModel(KnowledgeSource.name)
    private readonly sourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddings: EmbeddingProvider,
    private readonly documentText: DocumentTextExtractor,
    private readonly storage: KnowledgeStorageService,
    private readonly sitemapCrawl: SitemapCrawlService,
  ) {}

  async ingestSource(
    source: KnowledgeSourceDocument,
    body: CreateKnowledgeSourceDto,
  ): Promise<KnowledgeSourceDocument> {
    try {
      const extraction = await this.resolveSourceExtraction(body);
      return await this.ingestExtractedText(source, extraction);
    } catch (error) {
      return await this.markIngestError(source, error);
    }
  }

  async ingestUploadedFile(
    source: KnowledgeSourceDocument,
    file: KnowledgeUploadedFile,
  ): Promise<KnowledgeSourceDocument> {
    try {
      const extraction = await this.documentText.extractDocument(
        file.buffer,
        file.mimeType,
        file.originalFilename,
      );
      return await this.ingestExtractedText(source, extraction);
    } catch (error) {
      return await this.markIngestError(source, error);
    }
  }

  async processIngestJob(data: KnowledgeIngestJobData): Promise<void> {
    const source = await this.sourceModel
      .findOne({ _id: data.sourceId, projectId: data.projectId })
      .exec();

    if (!source || source.status === 'ready') {
      return;
    }

    source.status = 'indexing';
    source.errorMessage = undefined;
    await source.save();

    try {
      const extraction = await this.resolveExtractionForSource(source, data.content);
      await this.ingestExtractedText(source, extraction);
    } catch (error) {
      if (isRetryableIngestError(error)) {
        throw error;
      }
      await this.markIngestError(source, error);
    }
  }

  async markIngestErrorById(
    projectId: string,
    sourceId: string,
    error: unknown,
  ): Promise<void> {
    const source = await this.sourceModel
      .findOne({ _id: sourceId, projectId })
      .exec();

    if (!source || source.status === 'ready') {
      return;
    }

    await this.markIngestError(source, error);
  }

  private async ingestExtractedText(
    source: KnowledgeSourceDocument,
    extraction: DocumentExtractionResult,
  ): Promise<KnowledgeSourceDocument> {
    await this.chunkModel.deleteMany({
      projectId: source.projectId,
      sourceId: source._id,
    });

    const chunkGroups = buildChunkGroups(extraction, {
      sourceType: source.type as KnowledgeSourceType,
    });
    const childChunks = chunkGroups.flatMap((group) => group.children);
    if (childChunks.length === 0) {
      throw new BadRequestException('Knowledge source has no indexable text');
    }

    const embeddings = await this.embeddings.embedBatch(
      childChunks.map((chunk) => chunk.content),
    );

    if (embeddings.length !== childChunks.length) {
      throw new BadRequestException('Embedding batch size mismatch');
    }

    let embeddingIndex = 0;
    const sourcePageIds = source.pageIds?.length ? [...source.pageIds] : undefined;

    for (const group of chunkGroups) {
      const parentMetadata = attachPageIds(group.metadata, sourcePageIds);
      const parentDoc = await this.chunkModel.create({
        projectId: source.projectId,
        sourceId: source._id,
        sourceTitle: source.title,
        kind: 'parent',
        chunkIndex: group.parentIndex,
        content: group.parentContent,
        ...(parentMetadata ? { metadata: parentMetadata } : {}),
      });

      for (const child of group.children) {
        const metadata = attachPageIds(child.metadata, sourcePageIds);
        const embedding = embeddings[embeddingIndex]!;
        embeddingIndex += 1;

        await this.chunkModel.create({
          projectId: source.projectId,
          sourceId: source._id,
          sourceTitle: source.title,
          kind: 'child',
          parentChunkId: parentDoc._id,
          chunkIndex: child.index,
          content: child.content,
          ...(metadata ? { metadata } : {}),
          embedding,
        });
      }
    }

    source.status = 'ready';
    source.chunkCount = childChunks.length;
    source.errorMessage = undefined;
    await source.save();
    return source;
  }

  private async markIngestError(
    source: KnowledgeSourceDocument,
    error: unknown,
  ): Promise<KnowledgeSourceDocument> {
    source.status = 'error';
    source.errorMessage = formatIngestErrorMessage(error);
    source.chunkCount = 0;
    await source.save();
    return source;
  }

  private async resolveSourceExtraction(
    body: CreateKnowledgeSourceDto,
  ): Promise<DocumentExtractionResult> {
    if (body.type === 'text') {
      if (!body.content?.trim()) {
        throw new BadRequestException('content is required for text sources');
      }
      return { text: body.content.trim() };
    }

    if (body.type === 'url') {
      if (!body.url?.trim()) {
        throw new BadRequestException('url is required for url sources');
      }
      return fetchUrlContent(body.url.trim(), this.documentText);
    }

    if (body.type === 'sitemap') {
      if (!body.url?.trim()) {
        throw new BadRequestException('url is required for sitemap sources');
      }
      return this.sitemapCrawl.crawlSitemap(body.url.trim());
    }

    throw new BadRequestException(
      'document type requires file upload; use POST .../knowledge/upload',
    );
  }

  private async resolveExtractionForSource(
    source: KnowledgeSourceDocument,
    jobContent?: string,
  ): Promise<DocumentExtractionResult> {
    if (source.type === 'text') {
      const text = jobContent?.trim() || source.textContent?.trim();
      if (!text) {
        throw new BadRequestException(
          'content is required for text sources; recreate the source if content was not stored',
        );
      }
      return { text };
    }

    if (source.type === 'url') {
      if (!source.url?.trim()) {
        throw new BadRequestException('url is required for url sources');
      }
      return fetchUrlContent(source.url.trim(), this.documentText);
    }

    if (source.type === 'sitemap') {
      if (!source.url?.trim()) {
        throw new BadRequestException('url is required for sitemap sources');
      }
      return this.sitemapCrawl.crawlSitemap(source.url.trim());
    }

    if (source.type === 'document') {
      if (!source.storageKey) {
        throw new BadRequestException('document file is missing from storage');
      }

      const buffer = await this.storage.read(source.storageKey);
      return this.documentText.extractDocument(
        buffer,
        source.mimeType ?? 'application/octet-stream',
        source.originalFilename ?? 'upload.bin',
      );
    }

    throw new BadRequestException(`Unsupported source type: ${source.type}`);
  }
}

function buildChunkGroups(
  extraction: DocumentExtractionResult,
  options: { sourceType: KnowledgeSourceType },
) {
  if (extraction.sections?.length) {
    return chunkTextWithParentsFromPages(
      extraction.sections.map((section, index) => ({
        page: section.page ?? index + 1,
        text: section.text,
        pageUrl: section.pageUrl,
      })),
      options,
    );
  }

  if (extraction.pages?.length) {
    return chunkTextWithParentsFromPages(extraction.pages, options);
  }

  return chunkTextWithParents(extraction.text, options);
}

function attachPageIds(
  metadata: KnowledgeChunkBuildMetadata | undefined,
  pageIds: string[] | undefined,
): KnowledgeChunkBuildMetadata | undefined {
  const merged: KnowledgeChunkBuildMetadata = {
    ...metadata,
    ...(pageIds?.length ? { pageIds: [...pageIds] } : {}),
  };

  return hasChunkMetadata(merged) ? merged : undefined;
}

function hasChunkMetadata(metadata: {
  headingPath?: string[];
  sourceType?: string;
  page?: number;
  pageUrl?: string;
  pageIds?: string[];
}): boolean {
  return (
    (metadata.headingPath?.length ?? 0) > 0 ||
    Boolean(metadata.sourceType) ||
    metadata.page !== undefined ||
    Boolean(metadata.pageUrl) ||
    (metadata.pageIds?.length ?? 0) > 0
  );
}

function isRetryableIngestError(error: unknown): boolean {
  return !(error instanceof BadRequestException);
}

function formatIngestErrorMessage(error: unknown): string {
  if (error instanceof LlmHttpError) {
    const detail = extractApiErrorDetail(error.responseBody);
    return detail ? `${error.message}: ${detail}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ingestion failed';
}

function extractApiErrorDetail(responseBody: string): string | undefined {
  const trimmed = responseBody.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: string };
    };
    const message = parsed.error?.message?.trim();
    if (message) {
      return message;
    }
  } catch {
    // fall through to raw snippet
  }

  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}
