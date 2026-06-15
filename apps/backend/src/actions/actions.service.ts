import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  ActionData,
  CreateActionDto,
  Paginated,
  PaginationQuery,
  UpdateActionDto,
} from '@ahmedrioueche/actocore-shared';
import { UNCATEGORIZED_SECTION_ID } from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { normalizePagination, paginate } from '../common/pagination/pagination.util';
import { ProjectsService } from '../projects/projects.service';
import { StudioEntitlementsService } from '../studio-billing/studio-entitlements.service';
import { ActionSectionsService } from './action-sections.service';
import { AppPagesService } from './app-pages.service';
import { ActionSchemaValidator } from './action-schema.validator';
import {
  ProjectAction,
  ProjectActionDocument,
} from './schemas/project-action.schema';

export interface ListActionsFilter extends PaginationQuery {
  /** Section id, or the `uncategorized` sentinel for actions with no section. */
  sectionId?: string;
}

const DEFAULT_INPUT_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

@Injectable()
export class ActionsService {
  constructor(
    @InjectModel(ProjectAction.name)
    private readonly actionModel: Model<ProjectActionDocument>,
    private readonly projects: ProjectsService,
    private readonly sections: ActionSectionsService,
    private readonly appPages: AppPagesService,
    private readonly schemaValidator: ActionSchemaValidator,
    private readonly entitlements: StudioEntitlementsService,
  ) {}

  async create(projectId: string, body: CreateActionDto): Promise<ActionData> {
    const project = await this.projects.findByIdOrFail(null, projectId);
    if (project.accountId && !['legacy', 'playground'].includes(project.accountId)) {
      await this.entitlements.assertCanCreateAction(
        project.accountId,
        projectId,
      );
    }

    const inputSchema = body.inputSchema ?? DEFAULT_INPUT_SCHEMA;
    try {
      this.schemaValidator.assertCompilable(inputSchema);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid inputSchema',
      );
    }

    if (body.sectionId) {
      await this.sections.require(projectId, body.sectionId);
    }

    const pageIds = await this.resolvePageIds(projectId, body.pageIds);

    try {
      const doc = await this.actionModel.create({
        projectId,
        name: body.name,
        description: body.description,
        inputSchema,
        enabled: body.enabled ?? true,
        sectionId: body.sectionId ?? null,
        pageIds,
      });
      return this.toData(doc);
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new ConflictException(
          `Action "${body.name}" already exists for this project`,
        );
      }
      throw error;
    }
  }

  async list(projectId: string): Promise<ActionData[]> {
    await this.projects.assertExists(projectId);

    const docs = await this.actionModel
      .find(withProjectId(projectId))
      .sort({ name: 1 })
      .exec();

    return docs.map((doc) => this.toData(doc));
  }

  /** Paginated variant used by the Studio actions list route. */
  async listPaginated(
    projectId: string,
    query: ListActionsFilter = {},
  ): Promise<Paginated<ActionData>> {
    await this.projects.assertExists(projectId);

    const { page, limit, skip } = normalizePagination(query);
    const scoped = this.buildSectionFilter(projectId, query.sectionId);

    const [docs, total] = await Promise.all([
      this.actionModel
        .find(scoped)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.actionModel.countDocuments(scoped).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toData(doc)),
      total,
      { page, limit },
    );
  }

  async listEnabled(projectId: string): Promise<ActionData[]> {
    const [all, disabledSectionIds] = await Promise.all([
      this.list(projectId),
      this.sections.listDisabledIds(projectId),
    ]);
    const disabled = new Set(disabledSectionIds);
    return all.filter(
      (action) =>
        action.enabled && !(action.sectionId && disabled.has(action.sectionId)),
    );
  }

  private buildSectionFilter(
    projectId: string,
    sectionId?: string,
  ): Record<string, unknown> {
    if (!sectionId) {
      return withProjectId(projectId);
    }
    if (sectionId === UNCATEGORIZED_SECTION_ID) {
      return withProjectId(projectId, {
        $or: [{ sectionId: null }, { sectionId: { $exists: false } }],
      });
    }
    return withProjectId(projectId, { sectionId });
  }

  /** Section id -> name map for runtime selection grouping hints. */
  sectionNameMap(projectId: string): Promise<Map<string, string>> {
    return this.sections.nameMap(projectId);
  }

  async findById(projectId: string, actionId: string): Promise<ActionData> {
    const doc = await this.require(projectId, actionId);
    return this.toData(doc);
  }

  async update(
    projectId: string,
    actionId: string,
    body: UpdateActionDto,
  ): Promise<ActionData> {
    await this.require(projectId, actionId);

    const $set: Record<string, unknown> = {};
    if (body.description !== undefined) {
      $set.description = body.description;
    }
    if (body.inputSchema !== undefined) {
      try {
        this.schemaValidator.assertCompilable(body.inputSchema);
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Invalid inputSchema',
        );
      }
      $set.inputSchema = body.inputSchema;
    }
    if (body.enabled !== undefined) {
      $set.enabled = body.enabled;
    }
    if (body.sectionId !== undefined) {
      if (body.sectionId) {
        await this.sections.require(projectId, body.sectionId);
        $set.sectionId = body.sectionId;
      } else {
        $set.sectionId = null;
      }
    }
    if (body.pageIds !== undefined) {
      $set.pageIds = await this.resolvePageIds(projectId, body.pageIds);
    }

    const doc = await this.actionModel
      .findOneAndUpdate(
        withProjectId(projectId, { _id: actionId }),
        { $set },
        { new: true },
      )
      .exec();

    if (!doc) {
      throw new NotFoundException(`Action ${actionId} not found`);
    }

    return this.toData(doc);
  }

  async remove(
    projectId: string,
    actionId: string,
  ): Promise<{ id: string }> {
    const doc = await this.actionModel
      .findOneAndDelete(withProjectId(projectId, { _id: actionId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`Action ${actionId} not found`);
    }

    return { id: doc._id.toString() };
  }

  private async require(
    projectId: string,
    actionId: string,
  ): Promise<ProjectActionDocument> {
    await this.projects.assertExists(projectId);

    if (!Types.ObjectId.isValid(actionId)) {
      throw new NotFoundException(`Action ${actionId} not found`);
    }

    const doc = await this.actionModel
      .findOne(withProjectId(projectId, { _id: actionId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`Action ${actionId} not found`);
    }

    return doc;
  }

  private toData(doc: ProjectActionDocument): ActionData {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      name: doc.name,
      description: doc.description,
      inputSchema: doc.inputSchema,
      enabled: doc.enabled,
      sectionId: doc.sectionId ?? undefined,
      pageIds: doc.pageIds?.length ? [...doc.pageIds] : undefined,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private isDuplicateNameError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
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
}
