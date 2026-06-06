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
  KnowledgeSourceData,
  KnowledgeSourceStatus,
  KnowledgeSourceType,
  Paginated,
  PaginationQuery,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { basename } from 'node:path';
import type { KnowledgeResolvedConfig } from '../config/knowledge.config';
import { withProjectId } from '../common/tenant/tenant-scope';
import { normalizePagination, paginate } from '../common/pagination/pagination.util';
import { ProjectsService } from '../projects/projects.service';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import { KnowledgeStorageService } from './knowledge-storage.service';
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

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(KnowledgeSource.name)
    private readonly sourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    private readonly projects: ProjectsService,
    private readonly ingest: KnowledgeIngestService,
    private readonly storage: KnowledgeStorageService,
    private readonly config: ConfigService,
  ) {}

  async create(
    projectId: string,
    body: CreateKnowledgeSourceDto,
  ): Promise<KnowledgeSourceData> {
    await this.projects.assertExists(projectId);
    this.assertCreateBody(body);

    const doc = await this.sourceModel.create({
      projectId,
      type: body.type,
      title: body.title,
      url: body.url,
      status: 'pending',
      chunkCount: 0,
    });

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

  private assertCreateBody(body: CreateKnowledgeSourceDto): void {
    if (body.type === 'text' && !body.content?.trim()) {
      throw new BadRequestException('content is required for text sources');
    }
    if (body.type === 'url' && !body.url?.trim()) {
      throw new BadRequestException('url is required for url sources');
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

    return data;
  }
}
