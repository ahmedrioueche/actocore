import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateKnowledgeSourceDto,
  KnowledgeSourceData,
  KnowledgeSourceStatus,
  KnowledgeSourceType,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ProjectsService } from '../projects/projects.service';
import { KnowledgeIngestService } from './knowledge-ingest.service';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from './schemas/knowledge-source.schema';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(KnowledgeSource.name)
    private readonly sourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    private readonly projects: ProjectsService,
    private readonly ingest: KnowledgeIngestService,
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

  async list(projectId: string): Promise<KnowledgeSourceData[]> {
    await this.projects.assertExists(projectId);

    const docs = await this.sourceModel
      .find(withProjectId(projectId))
      .sort({ createdAt: -1 })
      .exec();

    return docs.map((doc) => this.toData(doc));
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
        'document type is not supported yet; use text with content',
      );
    }
  }

  private toData(doc: KnowledgeSourceDocument): KnowledgeSourceData {
    return {
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
  }
}
