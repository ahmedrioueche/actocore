import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  ActionSectionData,
  CreateActionSectionDto,
  UpdateActionSectionDto,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ProjectsService } from '../projects/projects.service';
import {
  ActionSection,
  ActionSectionDocument,
} from './schemas/action-section.schema';
import {
  ProjectAction,
  ProjectActionDocument,
} from './schemas/project-action.schema';

@Injectable()
export class ActionSectionsService {
  constructor(
    @InjectModel(ActionSection.name)
    private readonly sectionModel: Model<ActionSectionDocument>,
    @InjectModel(ProjectAction.name)
    private readonly actionModel: Model<ProjectActionDocument>,
    private readonly projects: ProjectsService,
  ) {}

  async list(projectId: string): Promise<ActionSectionData[]> {
    await this.projects.assertExists(projectId);

    const [docs, counts] = await Promise.all([
      this.sectionModel
        .find(withProjectId(projectId))
        .sort({ order: 1, name: 1 })
        .exec(),
      this.countBySection(projectId),
    ]);

    return docs.map((doc) => this.toData(doc, counts.get(doc._id.toString())));
  }

  async create(
    projectId: string,
    body: CreateActionSectionDto,
  ): Promise<ActionSectionData> {
    await this.projects.assertExists(projectId);

    const last = await this.sectionModel
      .findOne(withProjectId(projectId))
      .sort({ order: -1 })
      .exec();
    const order = last ? last.order + 1 : 0;

    try {
      const doc = await this.sectionModel.create({
        projectId,
        name: body.name,
        description: body.description,
        color: body.color,
        enabled: body.enabled ?? true,
        order,
      });
      return this.toData(doc, 0);
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new ConflictException(
          `Section "${body.name}" already exists for this project`,
        );
      }
      throw error;
    }
  }

  async update(
    projectId: string,
    sectionId: string,
    body: UpdateActionSectionDto,
  ): Promise<ActionSectionData> {
    await this.require(projectId, sectionId);

    const $set: Record<string, unknown> = {};
    if (body.name !== undefined) {
      $set.name = body.name;
    }
    if (body.description !== undefined) {
      $set.description = body.description;
    }
    if (body.color !== undefined) {
      $set.color = body.color;
    }
    if (body.enabled !== undefined) {
      $set.enabled = body.enabled;
    }

    try {
      const doc = await this.sectionModel
        .findOneAndUpdate(
          withProjectId(projectId, { _id: sectionId }),
          { $set },
          { new: true },
        )
        .exec();

      if (!doc) {
        throw new NotFoundException(`Section ${sectionId} not found`);
      }

      const count = await this.actionModel
        .countDocuments(withProjectId(projectId, { sectionId }))
        .exec();
      return this.toData(doc, count);
    } catch (error) {
      if (this.isDuplicateNameError(error)) {
        throw new ConflictException(
          `Section "${body.name ?? ''}" already exists for this project`,
        );
      }
      throw error;
    }
  }

  /** Deletes a section and moves its actions back to uncategorized. */
  async remove(
    projectId: string,
    sectionId: string,
  ): Promise<{ id: string }> {
    const doc = await this.sectionModel
      .findOneAndDelete(withProjectId(projectId, { _id: sectionId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    await this.actionModel
      .updateMany(
        withProjectId(projectId, { sectionId }),
        { $set: { sectionId: null } },
      )
      .exec();

    return { id: doc._id.toString() };
  }

  async reorder(
    projectId: string,
    sectionIds: string[],
  ): Promise<ActionSectionData[]> {
    await this.projects.assertExists(projectId);

    const validIds = sectionIds.filter((id) => Types.ObjectId.isValid(id));
    await Promise.all(
      validIds.map((id, index) =>
        this.sectionModel
          .updateOne(
            withProjectId(projectId, { _id: id }),
            { $set: { order: index } },
          )
          .exec(),
      ),
    );

    return this.list(projectId);
  }

  /** Section ids whose `enabled` flag is false (used to cascade to actions). */
  async listDisabledIds(projectId: string): Promise<string[]> {
    const docs = await this.sectionModel
      .find(withProjectId(projectId, { enabled: false }))
      .select('_id')
      .exec();
    return docs.map((doc) => doc._id.toString());
  }

  /** Map of section id -> name for runtime grouping / selection hints. */
  async nameMap(projectId: string): Promise<Map<string, string>> {
    const docs = await this.sectionModel
      .find(withProjectId(projectId))
      .select('_id name')
      .exec();
    return new Map(docs.map((doc) => [doc._id.toString(), doc.name]));
  }

  /** Throws unless the section exists for the project. */
  async require(
    projectId: string,
    sectionId: string,
  ): Promise<ActionSectionDocument> {
    await this.projects.assertExists(projectId);

    if (!Types.ObjectId.isValid(sectionId)) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const doc = await this.sectionModel
      .findOne(withProjectId(projectId, { _id: sectionId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    return doc;
  }

  private async countBySection(
    projectId: string,
  ): Promise<Map<string, number>> {
    const rows = await this.actionModel
      .aggregate<{ _id: string | null; count: number }>([
        { $match: { projectId } },
        { $group: { _id: '$sectionId', count: { $sum: 1 } } },
      ])
      .exec();

    const map = new Map<string, number>();
    for (const row of rows) {
      if (row._id) {
        map.set(row._id.toString(), row.count);
      }
    }
    return map;
  }

  private toData(
    doc: ActionSectionDocument,
    actionCount?: number,
  ): ActionSectionData {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      name: doc.name,
      description: doc.description,
      color: doc.color,
      enabled: doc.enabled,
      order: doc.order,
      actionCount,
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
}
