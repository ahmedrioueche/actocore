import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateProjectDto,
  ListProjectsQuery,
  Paginated,
  PaginationQuery,
  ProjectData,
  ProjectSettings,
  UpdateProjectDto,
  UpdateProjectSettingsDto,
} from '@ahmedrioueche/actocore-shared';
import { ErrorCode, StudioRole } from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { PLAYGROUND_ACCOUNT_ID } from '../config/playground.config';
import { withProjectId } from '../common/tenant/tenant-scope';
import { normalizePagination, paginate } from '../common/pagination/pagination.util';
import { StudioEntitlementsService } from '../studio-billing/studio-entitlements.service';
import { StudioAccessService } from '../studio/studio-access.service';
import { StudioPlatformNotificationService } from '../studio/studio-platform-notification.service';
import type { StudioRequestContext } from '../studio/studio-context';
import { ProjectDeleteService } from './project-delete.service';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly studioAccess: StudioAccessService,
    @Inject(forwardRef(() => StudioEntitlementsService))
    private readonly entitlements: StudioEntitlementsService,
    private readonly projectDelete: ProjectDeleteService,
    private readonly platformNotifications: StudioPlatformNotificationService,
  ) {}

  async delete(
    ctx: StudioRequestContext,
    projectId: string,
  ): Promise<{ message: string }> {
    if (
      ctx.role !== StudioRole.USER_ADMIN &&
      ctx.role !== StudioRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Only workspace admins can delete projects',
      });
    }

    const project = await this.findByIdOrFail(ctx, projectId);
    await this.projectDelete.deleteProject(projectId, project.accountId);
    return { message: 'Project deleted.' };
  }

  async create(
    ctx: StudioRequestContext | null,
    body: CreateProjectDto,
    options?: { notificationSource?: 'signup_default' | 'user' },
  ): Promise<ProjectData> {
    const accountId = ctx?.accountId;
    if (accountId) {
      await this.entitlements.assertCanCreateProject(accountId);
    }
    if (!accountId) {
      const doc = await this.projectModel.create({
        name: body.name,
        accountId: 'legacy',
        settings: body.settings ?? {},
      });
      return this.toData(doc);
    }

    const doc = await this.projectModel.create({
      name: body.name,
      accountId,
      settings: body.settings ?? {},
    });
    const project = this.toData(doc);
    this.platformNotifications.notifyProjectCreated({
      projectId: project.id,
      projectName: project.name,
      accountId,
      createdByEmail: ctx?.email,
      source: options?.notificationSource ?? 'user',
    });
    return project;
  }

  async createForPlayground(name: string): Promise<ProjectData> {
    const doc = await this.projectModel.create({
      name: name.trim() || 'My playground project',
      accountId: PLAYGROUND_ACCOUNT_ID,
      settings: {},
    });
    return this.toData(doc);
  }

  async list(
    ctx: StudioRequestContext | null,
    query: ListProjectsQuery = {},
  ): Promise<ProjectData[]> {
    const limit = query.limit ?? 50;
    const filter = this.buildListFilter(ctx, query);

    const docs = await this.projectModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .exec();
    return docs.map((doc) => this.toData(doc));
  }

  /** Paginated variant used by the Studio list route. */
  async listPaginated(
    ctx: StudioRequestContext | null,
    query: ListProjectsQuery & PaginationQuery = {},
  ): Promise<Paginated<ProjectData>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter = this.buildListFilter(ctx, query);

    const [docs, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toData(doc)),
      total,
      { page, limit },
    );
  }

  private buildListFilter(
    ctx: StudioRequestContext | null,
    query: ListProjectsQuery,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = ctx
      ? {
          ...this.studioAccess.accountFilter(ctx),
          ...this.studioAccess.projectIdFilter(ctx),
        }
      : {};

    if (query.archived === true) {
      filter.archived = true;
    } else {
      filter.archived = { $ne: true };
    }

    const search = query.search?.trim();
    if (search) {
      filter.name = { $regex: this.escapeRegex(search), $options: 'i' };
    }

    return filter;
  }

  async findById(
    ctx: StudioRequestContext | null,
    projectId: string,
  ): Promise<ProjectData | null> {
    if (!Types.ObjectId.isValid(projectId)) {
      return null;
    }
    const doc = await this.projectModel.findById(projectId).exec();
    if (!doc) {
      return null;
    }
    if (ctx) {
      this.studioAccess.assertProjectAccess(ctx, projectId);
      if (
        ctx.accountId &&
        doc.accountId &&
        doc.accountId !== 'legacy' &&
        doc.accountId !== ctx.accountId
      ) {
        return null;
      }
    }
    return this.toData(doc);
  }

  async findByIdOrFail(
    ctx: StudioRequestContext | null,
    projectId: string,
  ): Promise<ProjectData> {
    const project = await this.findById(ctx, projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  async assertExists(projectId: string): Promise<void> {
    await this.findByIdOrFail(null, projectId);
  }

  async assertExistsForAccount(
    ctx: StudioRequestContext,
    projectId: string,
  ): Promise<void> {
    await this.findByIdOrFail(ctx, projectId);
  }

  async update(
    ctx: StudioRequestContext | null,
    projectId: string,
    patch: UpdateProjectDto,
  ): Promise<ProjectData> {
    await this.findByIdOrFail(ctx, projectId);

    const $set: Record<string, unknown> = {};
    if (patch.name !== undefined) {
      $set.name = patch.name.trim();
    }
    if (patch.archived !== undefined) {
      $set.archived = patch.archived;
      $set.archivedAt = patch.archived ? new Date() : null;
    }

    if (Object.keys($set).length === 0) {
      return this.findByIdOrFail(ctx, projectId);
    }

    const doc = await this.projectModel
      .findByIdAndUpdate(projectId, { $set }, { new: true })
      .exec();

    if (!doc) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return this.toData(doc);
  }

  async updateSettings(
    ctx: StudioRequestContext | null,
    projectId: string,
    patch: UpdateProjectSettingsDto,
  ): Promise<ProjectData> {
    await this.findByIdOrFail(ctx, projectId);

    const $set: Record<string, unknown> = {};
    if (patch.systemPrompt !== undefined) {
      $set['settings.systemPrompt'] = patch.systemPrompt;
    }
    if (patch.rules !== undefined) {
      $set['settings.rules'] = patch.rules;
    }
    if (patch.tone !== undefined) {
      $set['settings.tone'] = patch.tone;
    }

    const doc = await this.projectModel
      .findByIdAndUpdate(projectId, { $set }, { new: true })
      .exec();

    if (!doc) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    return this.toData(doc);
  }

  /** Tenant-scoped existence check for a document id in any collection. */
  async assertDocumentBelongsToProject(
    projectId: string,
    collection: Model<{ projectId: string }>,
    documentId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(documentId)) {
      throw new NotFoundException('Resource not found');
    }

    const doc = await collection
      .findOne(withProjectId(projectId, { _id: documentId }))
      .exec();

    if (!doc) {
      throw new NotFoundException('Resource not found');
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toData(doc: ProjectDocument): ProjectData {
    const archived = doc.archived === true;
    return {
      id: doc._id.toString(),
      accountId: doc.accountId ?? 'legacy',
      name: doc.name,
      archived,
      archivedAt: archived && doc.archivedAt
        ? doc.archivedAt.toISOString()
        : undefined,
      settings: this.normalizeSettings(doc.settings),
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private normalizeSettings(settings: ProjectSettings): ProjectSettings {
    return {
      systemPrompt: settings.systemPrompt,
      rules: settings.rules ?? [],
      tone: settings.tone,
    };
  }
}
