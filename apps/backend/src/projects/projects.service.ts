import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateProjectDto,
  ProjectData,
  ProjectSettings,
  UpdateProjectSettingsDto,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { Project, ProjectDocument } from './schemas/project.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(body: CreateProjectDto): Promise<ProjectData> {
    const doc = await this.projectModel.create({
      name: body.name,
      settings: body.settings ?? {},
    });
    return this.toData(doc);
  }

  async findById(projectId: string): Promise<ProjectData | null> {
    if (!Types.ObjectId.isValid(projectId)) {
      return null;
    }
    const doc = await this.projectModel.findById(projectId).exec();
    return doc ? this.toData(doc) : null;
  }

  async findByIdOrFail(projectId: string): Promise<ProjectData> {
    const project = await this.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return project;
  }

  async assertExists(projectId: string): Promise<void> {
    await this.findByIdOrFail(projectId);
  }

  async updateSettings(
    projectId: string,
    patch: UpdateProjectSettingsDto,
  ): Promise<ProjectData> {
    await this.findByIdOrFail(projectId);

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

  private toData(doc: ProjectDocument): ProjectData {
    return {
      id: doc._id.toString(),
      name: doc.name,
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
