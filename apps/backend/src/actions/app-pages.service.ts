import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  AppPageData,
  AppPageManifestEntry,
  AssignAppPageActionsDto,
  CreateAppPageDto,
  UpdateAppPageDto,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ProjectsService } from '../projects/projects.service';
import { SdkConfigService } from '../projects/sdk-config/sdk-config.service';
import { AppPage, AppPageDocument } from './schemas/app-page.schema';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from '../knowledge/schemas/knowledge-chunk.schema';
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
} from '../knowledge/schemas/knowledge-source.schema';
import {
  ProjectAction,
  ProjectActionDocument,
} from './schemas/project-action.schema';

@Injectable()
export class AppPagesService {
  constructor(
    @InjectModel(AppPage.name)
    private readonly pageModel: Model<AppPageDocument>,
    @InjectModel(ProjectAction.name)
    private readonly actionModel: Model<ProjectActionDocument>,
    @InjectModel(KnowledgeSource.name)
    private readonly knowledgeSourceModel: Model<KnowledgeSourceDocument>,
    @InjectModel(KnowledgeChunk.name)
    private readonly knowledgeChunkModel: Model<KnowledgeChunkDocument>,
    private readonly projects: ProjectsService,
    private readonly sdkConfig: SdkConfigService,
  ) {}

  /**
   * Fingerprint for SDK polling — bumps when sdk config, pages, actions, or
   * knowledge sources change for the project.
   */
  async getProjectDataRevision(projectId: string): Promise<string> {
    const filter = withProjectId(projectId);
    const [
      sdk,
      pageCount,
      latestPage,
      actionCount,
      latestAction,
      knowledgeCount,
      latestKnowledge,
    ] = await Promise.all([
      this.sdkConfig.getConfig(projectId),
      this.pageModel.countDocuments(filter),
      this.pageModel
        .findOne(filter)
        .sort({ updatedAt: -1 })
        .select('updatedAt')
        .lean()
        .exec(),
      this.actionModel.countDocuments(filter),
      this.actionModel
        .findOne(filter)
        .sort({ updatedAt: -1 })
        .select('updatedAt')
        .lean()
        .exec(),
      this.knowledgeSourceModel.countDocuments(filter),
      this.knowledgeSourceModel
        .findOne(filter)
        .sort({ updatedAt: -1 })
        .select('updatedAt')
        .lean()
        .exec(),
    ]);

    const ts = (doc: { updatedAt?: Date } | null) =>
      doc?.updatedAt?.getTime() ?? 0;

    return [
      sdk.sdkConfigVersion,
      pageCount,
      ts(latestPage),
      actionCount,
      ts(latestAction),
      knowledgeCount,
      ts(latestKnowledge),
    ].join(':');
  }

  async list(projectId: string): Promise<AppPageData[]> {
    await this.projects.assertExists(projectId);

    const [docs, counts] = await Promise.all([
      this.pageModel
        .find(withProjectId(projectId))
        .sort({ order: 1, title: 1 })
        .exec(),
      this.countByPage(projectId),
    ]);

    return docs.map((doc) => this.toData(doc, counts.get(doc._id.toString())));
  }

  async listManifest(projectId: string): Promise<AppPageManifestEntry[]> {
    const docs = await this.pageModel
      .find(withProjectId(projectId, { enabled: true }))
      .sort({ order: 1, title: 1 })
      .exec();

    return docs.map((doc) => this.toManifestEntry(doc));
  }

  async create(projectId: string, body: CreateAppPageDto): Promise<AppPageData> {
    await this.projects.assertExists(projectId);

    const last = await this.pageModel
      .findOne(withProjectId(projectId))
      .sort({ order: -1 })
      .exec();
    const order = last ? last.order + 1 : 0;

    try {
      const doc = await this.pageModel.create({
        projectId,
        slug: body.slug,
        title: body.title,
        route: body.route,
        description: body.description,
        enabled: body.enabled ?? true,
        order,
      });
      return this.toData(doc, 0);
    } catch (error) {
      if (this.isDuplicateSlugError(error)) {
        throw new ConflictException(
          `Page slug "${body.slug}" already exists for this project`,
        );
      }
      throw error;
    }
  }

  async update(
    projectId: string,
    pageId: string,
    body: UpdateAppPageDto,
  ): Promise<AppPageData> {
    await this.require(projectId, pageId);

    const $set: Record<string, unknown> = {};
    if (body.title !== undefined) {
      $set.title = body.title;
    }
    if (body.route !== undefined) {
      $set.route = body.route;
    }
    if (body.description !== undefined) {
      $set.description = body.description;
    }
    if (body.enabled !== undefined) {
      $set.enabled = body.enabled;
    }

    const doc = await this.pageModel
      .findOneAndUpdate(
        withProjectId(projectId, { _id: pageId }),
        { $set },
        { new: true },
      )
      .exec();

    if (!doc) {
      throw new NotFoundException(`App page ${pageId} not found`);
    }

    const count = await this.actionModel
      .countDocuments(withProjectId(projectId, { pageIds: pageId }))
      .exec();
    return this.toData(doc, count);
  }

  async remove(projectId: string, pageId: string): Promise<{ id: string }> {
    const doc = await this.pageModel
      .findOneAndDelete(withProjectId(projectId, { _id: pageId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`App page ${pageId} not found`);
    }

    await this.actionModel
      .updateMany(withProjectId(projectId, { pageIds: pageId }), {
        $pull: { pageIds: pageId },
      })
      .exec();

    await this.knowledgeSourceModel
      .updateMany(withProjectId(projectId, { pageIds: pageId }), {
        $pull: { pageIds: pageId },
      })
      .exec();

    await this.knowledgeChunkModel
      .updateMany(withProjectId(projectId, { 'metadata.pageIds': pageId }), {
        $pull: { 'metadata.pageIds': pageId },
      })
      .exec();

    return { id: doc._id.toString() };
  }

  async reorder(
    projectId: string,
    pageIds: string[],
  ): Promise<AppPageData[]> {
    await this.projects.assertExists(projectId);

    const validIds = pageIds.filter((id) => Types.ObjectId.isValid(id));
    await Promise.all(
      validIds.map((id, index) =>
        this.pageModel
          .updateOne(
            withProjectId(projectId, { _id: id }),
            { $set: { order: index } },
          )
          .exec(),
      ),
    );

    return this.list(projectId);
  }

  async assignActions(
    projectId: string,
    pageId: string,
    body: AssignAppPageActionsDto,
  ): Promise<AppPageData> {
    await this.require(projectId, pageId);

    const actionIds = [...new Set(body.actionIds)];
    for (const actionId of actionIds) {
      if (!Types.ObjectId.isValid(actionId)) {
        throw new BadRequestException(`Invalid action id: ${actionId}`);
      }
      const action = await this.actionModel
        .findOne(withProjectId(projectId, { _id: actionId }))
        .exec();
      if (!action) {
        throw new NotFoundException(`Action ${actionId} not found`);
      }
    }

    await this.actionModel
      .updateMany(withProjectId(projectId, { pageIds: pageId }), {
        $pull: { pageIds: pageId },
      })
      .exec();

    if (actionIds.length > 0) {
      await this.actionModel
        .updateMany(withProjectId(projectId, { _id: { $in: actionIds } }), {
          $addToSet: { pageIds: pageId },
        })
        .exec();
    }

    const doc = await this.require(projectId, pageId);
    return this.toData(doc, actionIds.length);
  }

  async require(
    projectId: string,
    pageId: string,
  ): Promise<AppPageDocument> {
    await this.projects.assertExists(projectId);

    if (!Types.ObjectId.isValid(pageId)) {
      throw new NotFoundException(`App page ${pageId} not found`);
    }

    const doc = await this.pageModel
      .findOne(withProjectId(projectId, { _id: pageId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`App page ${pageId} not found`);
    }

    return doc;
  }

  async requireBySlug(
    projectId: string,
    slug: string,
  ): Promise<AppPageDocument | null> {
    return this.pageModel
      .findOne(withProjectId(projectId, { slug, enabled: true }))
      .exec();
  }

  async slugMap(projectId: string): Promise<Map<string, string>> {
    const docs = await this.pageModel
      .find(withProjectId(projectId))
      .select('_id slug title')
      .exec();
    return new Map(docs.map((doc) => [doc.slug, doc._id.toString()]));
  }

  async titleMap(projectId: string): Promise<Map<string, string>> {
    const docs = await this.pageModel
      .find(withProjectId(projectId))
      .select('_id title')
      .exec();
    return new Map(docs.map((doc) => [doc._id.toString(), doc.title]));
  }

  private async countByPage(projectId: string): Promise<Map<string, number>> {
    const rows = await this.actionModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { projectId, pageIds: { $exists: true, $ne: [] } } },
        { $unwind: '$pageIds' },
        { $group: { _id: '$pageIds', count: { $sum: 1 } } },
      ])
      .exec();

    return new Map(rows.map((row) => [row._id, row.count]));
  }

  private toData(doc: AppPageDocument, actionCount?: number): AppPageData {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      slug: doc.slug,
      title: doc.title,
      route: doc.route,
      description: doc.description,
      enabled: doc.enabled,
      order: doc.order,
      actionCount,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private toManifestEntry(doc: AppPageDocument): AppPageManifestEntry {
    return {
      id: doc.slug,
      pageId: doc._id.toString(),
      title: doc.title,
      route: doc.route,
      description: doc.description,
    };
  }

  private isDuplicateSlugError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}
