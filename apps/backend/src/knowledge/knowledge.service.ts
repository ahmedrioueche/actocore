import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateKnowledgeSourceDto,
  KnowledgeChunkData,
  KnowledgeChunkKind,
  KnowledgeChunkMetadata,
  KnowledgeRetrieveTestDto,
  KnowledgeRetrieveTestResult,
  KnowledgeSourceData,
  KnowledgeSourceStatus,
  KnowledgeSourceType,
  Paginated,
  PaginationQuery,
  UpdateKnowledgeSourceDto,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { basename } from 'node:path';
import type { KnowledgeResolvedConfig } from '../config/knowledge.config';
import { AppPagesService } from '../actions/app-pages.service';
import { withProjectId } from '../common/tenant/tenant-scope';
import { normalizePagination, paginate } from '../common/pagination/pagination.util';
import { ProjectsService } from '../projects/projects.service';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import { KnowledgeIngestQueueService } from './knowledge-ingest.queue.service';
import type { KnowledgeIngestJobData } from './knowledge-ingest.types';
import { KnowledgeStorageService } from './knowledge-storage.service';
import { RagRetrievalService } from './rag-retrieval.service';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from './schemas/knowledge-source.schema';
import {
  assertSafeKnowledgeContent,
  MaliciousKnowledgeContentError,
  resolveKnowledgeMimeType,
  UnsupportedKnowledgeFileError,
} from './utils/knowledge-mime.util';
import { truncateKnowledgeExcerpt } from './utils/normalize-knowledge-text';

const RETRIEVE_TEST_DEFAULT_TOP_K = 10;
const CHUNK_PREVIEW_EXCERPT_CHARS = 480;

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(KnowledgeSource.name)
    private readonly sourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    private readonly projects: ProjectsService,
    private readonly ingest: KnowledgeIngestService,
    private readonly ingestQueue: KnowledgeIngestQueueService,
    private readonly storage: KnowledgeStorageService,
    private readonly config: ConfigService,
    private readonly appPages: AppPagesService,
    private readonly retrieval: RagRetrievalService,
  ) {}

  async create(
    projectId: string,
    body: CreateKnowledgeSourceDto,
  ): Promise<KnowledgeSourceData> {
    await this.projects.assertExists(projectId);
    this.assertCreateBody(body);
    const pageIds = await this.resolvePageIds(projectId, body.pageIds);

    const doc = await this.sourceModel.create({
      projectId,
      type: body.type,
      title: body.title,
      url: body.url,
      pageIds,
      ...(body.type === 'text' ? { textContent: body.content?.trim() } : {}),
      status: 'pending',
      chunkCount: 0,
    });

    if (this.ingestQueue.isEnabled()) {
      await this.ingestQueue.enqueue({
        sourceId: doc._id.toString(),
        projectId,
        content: body.type === 'text' ? body.content?.trim() : undefined,
      });
      doc.status = 'indexing';
      await doc.save();
      return this.toData(doc);
    }

    const ingested = await this.ingest.ingestSource(doc, body);
    return this.toData(ingested);
  }

  async uploadFile(
    projectId: string,
    file: Express.Multer.File | undefined,
    title?: string,
  ): Promise<KnowledgeSourceData> {
    await this.projects.assertExists(projectId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }

    const knowledge = this.config.getOrThrow<KnowledgeResolvedConfig>('knowledge');
    if (file.size > knowledge.maxUploadBytes) {
      throw new PayloadTooLargeException(
        `File exceeds maximum size of ${knowledge.maxUploadBytes} bytes`,
      );
    }

    const originalFilename = file.originalname?.trim() || 'upload.bin';

    let mimeType: string;
    try {
      mimeType = resolveKnowledgeMimeType(file.mimetype, originalFilename);
    } catch (err) {
      if (err instanceof UnsupportedKnowledgeFileError) {
        throw new UnsupportedMediaTypeException(err.message);
      }
      throw err;
    }

    // Defense in depth: ensure bytes match the declared type (anti-spoofing).
    try {
      assertSafeKnowledgeContent(file.buffer, mimeType);
    } catch (err) {
      if (err instanceof MaliciousKnowledgeContentError) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const docTitle = title?.trim() || basename(originalFilename).replace(/\.[^.]+$/, '') || 'Document';

    const doc = await this.sourceModel.create({
      projectId,
      type: 'document',
      title: docTitle,
      pageIds: [],
      status: 'pending',
      chunkCount: 0,
      originalFilename,
      mimeType,
      byteSize: file.size,
    });

    const storageKey = this.storage.storageKey(
      projectId,
      doc._id.toString(),
      originalFilename,
    );
    doc.storageKey = storageKey;
    await this.storage.save(storageKey, file.buffer);
    await doc.save();

    if (this.ingestQueue.isEnabled()) {
      await this.ingestQueue.enqueue({
        sourceId: doc._id.toString(),
        projectId,
      });
      doc.status = 'indexing';
      await doc.save();
      return this.toData(doc);
    }

    const ingested = await this.ingest.ingestUploadedFile(doc, {
      buffer: file.buffer,
      mimeType,
      originalFilename,
    });

    return this.toData(ingested);
  }

  async list(projectId: string): Promise<KnowledgeSourceData[]> {
    await this.projects.assertExists(projectId);

    const docs = await this.sourceModel
      .find(withProjectId(projectId))
      .sort({ createdAt: -1 })
      .exec();

    return docs.map((doc) => this.toData(doc));
  }

  /** Paginated variant used by the Studio knowledge list route. */
  async listPaginated(
    projectId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<KnowledgeSourceData>> {
    await this.projects.assertExists(projectId);

    const { page, limit, skip } = normalizePagination(query);
    const scoped = withProjectId(projectId);

    const [docs, total] = await Promise.all([
      this.sourceModel
        .find(scoped)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sourceModel.countDocuments(scoped).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toData(doc)),
      total,
      { page, limit },
    );
  }

  async findById(
    projectId: string,
    sourceId: string,
  ): Promise<KnowledgeSourceData> {
    const doc = await this.require(projectId, sourceId);
    return this.toData(doc);
  }

  async retrieveTest(
    projectId: string,
    body: KnowledgeRetrieveTestDto,
  ): Promise<KnowledgeRetrieveTestResult> {
    await this.projects.assertExists(projectId);

    const query = body.query.trim();
    const topK = body.topK ?? RETRIEVE_TEST_DEFAULT_TOP_K;
    const options = body.currentPageId?.trim()
      ? { currentPageId: body.currentPageId.trim() }
      : undefined;

    const result = await this.retrieval.retrieve(
      projectId,
      query,
      topK,
      options,
    );

    const chunkIds = result.rankedHits.map((hit) => hit.chunkId);
    const chunks =
      chunkIds.length > 0
        ? await this.chunkModel
            .find({ _id: { $in: chunkIds.map((id) => new Types.ObjectId(id)) } })
            .exec()
        : [];
    const chunkById = new Map(chunks.map((chunk) => [chunk._id.toString(), chunk]));

    const hits = result.rankedHits.map((hit) => {
      const chunk = chunkById.get(hit.chunkId);
      return {
        chunkId: hit.chunkId,
        sourceId: hit.sourceId,
        sourceTitle: chunk?.sourceTitle ?? '',
        chunkIndex: chunk?.chunkIndex ?? 0,
        score: hit.score,
        excerpt: truncateKnowledgeExcerpt(
          hit.content,
          CHUNK_PREVIEW_EXCERPT_CHARS,
        ),
        kind: chunk?.kind as KnowledgeChunkKind | undefined,
        metadata: this.toChunkMetadata(chunk?.metadata),
      };
    });

    return {
      query,
      emptyReason: result.emptyReason,
      hits,
      retrievalLog: result.retrievalLog,
    };
  }

  async listChunks(
    projectId: string,
    sourceId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<KnowledgeChunkData>> {
    const doc = await this.require(projectId, sourceId);
    const { page, limit, skip } = normalizePagination(query);
    const scoped = withProjectId(projectId, { sourceId: doc._id });

    const [chunks, total] = await Promise.all([
      this.chunkModel
        .find(scoped)
        .select('-embedding')
        .sort({ chunkIndex: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.chunkModel.countDocuments(scoped).exec(),
    ]);

    return paginate(
      chunks.map((chunk) => this.toChunkData(projectId, chunk)),
      total,
      { page, limit },
    );
  }

  async update(
    projectId: string,
    sourceId: string,
    body: UpdateKnowledgeSourceDto,
  ): Promise<KnowledgeSourceData> {
    const doc = await this.require(projectId, sourceId);

    if (body.pageIds !== undefined) {
      doc.pageIds = await this.resolvePageIds(projectId, body.pageIds);
      await doc.save();
      await this.syncChunkPageIds(projectId, doc._id, doc.pageIds);
    }

    return this.toData(doc);
  }

  async reindex(
    projectId: string,
    sourceId: string,
  ): Promise<KnowledgeSourceData> {
    const doc = await this.require(projectId, sourceId);

    if (doc.status === 'indexing' || doc.status === 'pending') {
      throw new BadRequestException('Knowledge source is already being indexed');
    }

    this.assertReindexable(doc);

    await this.chunkModel.deleteMany({
      projectId,
      sourceId: doc._id,
    });

    doc.status = 'pending';
    doc.chunkCount = 0;
    doc.errorMessage = undefined;
    await doc.save();

    const jobData: KnowledgeIngestJobData = {
      sourceId: doc._id.toString(),
      projectId,
      content: doc.type === 'text' ? doc.textContent : undefined,
    };

    if (this.ingestQueue.isEnabled()) {
      await this.ingestQueue.enqueue(jobData, { replace: true });
      doc.status = 'indexing';
      await doc.save();
      return this.toData(doc);
    }

    await this.ingest.processIngestJob(jobData);
    const refreshed = await this.require(projectId, sourceId);
    return this.toData(refreshed);
  }

  async remove(
    projectId: string,
    sourceId: string,
  ): Promise<{ id: string }> {
    const doc = await this.require(projectId, sourceId);

    await this.chunkModel.deleteMany({
      projectId,
      sourceId: doc._id,
    });

    await this.storage.remove(doc.storageKey);
    await doc.deleteOne();
    return { id: sourceId };
  }

  private async require(
    projectId: string,
    sourceId: string,
  ): Promise<KnowledgeSourceDocument> {
    await this.projects.assertExists(projectId);

    if (!Types.ObjectId.isValid(sourceId)) {
      throw new NotFoundException(`Knowledge source ${sourceId} not found`);
    }

    const doc = await this.sourceModel
      .findOne(withProjectId(projectId, { _id: sourceId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`Knowledge source ${sourceId} not found`);
    }

    return doc;
  }

  private assertReindexable(doc: KnowledgeSourceDocument): void {
    if (doc.type === 'text' && !doc.textContent?.trim()) {
      throw new BadRequestException(
        'Text source has no stored content; delete and recreate the source to re-index',
      );
    }
    if (doc.type === 'url' && !doc.url?.trim()) {
      throw new BadRequestException('URL source is missing url');
    }
    if (doc.type === 'sitemap' && !doc.url?.trim()) {
      throw new BadRequestException('Sitemap source is missing url');
    }
    if (doc.type === 'document' && !doc.storageKey?.trim()) {
      throw new BadRequestException('Document source is missing file storage');
    }
  }

  private assertCreateBody(body: CreateKnowledgeSourceDto): void {
    if (body.type === 'text' && !body.content?.trim()) {
      throw new BadRequestException('content is required for text sources');
    }
    if (body.type === 'url' && !body.url?.trim()) {
      throw new BadRequestException('url is required for url sources');
    }
    if (body.type === 'sitemap' && !body.url?.trim()) {
      throw new BadRequestException('url is required for sitemap sources');
    }
    if (body.type === 'document') {
      throw new BadRequestException(
        'document type requires file upload; use POST .../knowledge/upload',
      );
    }
  }

  private toData(doc: KnowledgeSourceDocument): KnowledgeSourceData {
    const data: KnowledgeSourceData = {
      id: doc._id.toString(),
      projectId: doc.projectId,
      type: doc.type as KnowledgeSourceType,
      title: doc.title,
      url: doc.url,
      status: doc.status as KnowledgeSourceStatus,
      chunkCount: doc.chunkCount,
      errorMessage: doc.errorMessage,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };

    if (doc.originalFilename && doc.mimeType && doc.byteSize != null) {
      data.file = {
        originalFilename: doc.originalFilename,
        mimeType: doc.mimeType,
        byteSize: doc.byteSize,
      };
    }

    if (doc.pageIds?.length) {
      data.pageIds = [...doc.pageIds];
    }

    return data;
  }

  private toChunkData(
    projectId: string,
    chunk: KnowledgeChunkDocument,
  ): KnowledgeChunkData {
    const data: KnowledgeChunkData = {
      id: chunk._id.toString(),
      projectId,
      sourceId: chunk.sourceId.toString(),
      chunkIndex: chunk.chunkIndex,
      content: truncateKnowledgeExcerpt(
        chunk.content,
        CHUNK_PREVIEW_EXCERPT_CHARS,
      ),
      kind: chunk.kind as KnowledgeChunkKind,
    };

    if (chunk.parentChunkId) {
      data.parentChunkId = chunk.parentChunkId.toString();
    }

    const metadata = this.toChunkMetadata(chunk.metadata);
    if (metadata) {
      data.metadata = metadata;
    }

    return data;
  }

  private toChunkMetadata(
    metadata?: KnowledgeChunkDocument['metadata'],
  ): KnowledgeChunkMetadata | undefined {
    if (!metadata) {
      return undefined;
    }

    const mapped: KnowledgeChunkMetadata = {};
    if (metadata.headingPath?.length) {
      mapped.headingPath = [...metadata.headingPath];
    }
    if (metadata.sourceType) {
      mapped.sourceType = metadata.sourceType;
    }
    if (metadata.page !== undefined && metadata.page > 0) {
      mapped.page = metadata.page;
    }
    if (metadata.pageUrl) {
      mapped.pageUrl = metadata.pageUrl;
    }
    if (metadata.pageIds?.length) {
      mapped.pageIds = [...metadata.pageIds];
    }

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }

  private async resolvePageIds(
    projectId: string,
    pageIds?: string[],
  ): Promise<string[]> {
    if (!pageIds?.length) {
      return [];
    }

    const unique = [...new Set(pageIds)];
    for (const pageId of unique) {
      await this.appPages.require(projectId, pageId);
    }

    return unique;
  }

  private async syncChunkPageIds(
    projectId: string,
    sourceId: Types.ObjectId,
    pageIds: string[],
  ): Promise<void> {
    const update =
      pageIds.length > 0
        ? { $set: { 'metadata.pageIds': pageIds } }
        : { $unset: { 'metadata.pageIds': '' } };

    await this.chunkModel
      .updateMany(withProjectId(projectId, { sourceId }), update)
      .exec();
  }
}
