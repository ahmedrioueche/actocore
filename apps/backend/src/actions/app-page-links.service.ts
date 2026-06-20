import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  AppPageLinkData,
  AppPageLinkManifestEntry,
  CreateAppPageLinkDto,
  UpdateAppPageLinkDto,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ProjectsService } from '../projects/projects.service';
import { AppPage, AppPageDocument } from './schemas/app-page.schema';
import {
  AppPageLink,
  AppPageLinkDocument,
} from './schemas/app-page-link.schema';

@Injectable()
export class AppPageLinksService {
  constructor(
    @InjectModel(AppPageLink.name)
    private readonly linkModel: Model<AppPageLinkDocument>,
    @InjectModel(AppPage.name)
    private readonly pageModel: Model<AppPageDocument>,
    private readonly projects: ProjectsService,
  ) {}

  async list(projectId: string): Promise<AppPageLinkData[]> {
    await this.projects.assertExists(projectId);
    const docs = await this.linkModel
      .find(withProjectId(projectId))
      .sort({ createdAt: 1 })
      .exec();
    return docs.map((doc) => this.toData(doc));
  }

  async listManifest(projectId: string): Promise<AppPageLinkManifestEntry[]> {
    const docs = await this.linkModel.find(withProjectId(projectId)).exec();
    return docs.map((doc) => ({
      sourcePageId: doc.sourcePageId,
      targetPageId: doc.targetPageId,
      label: doc.label,
    }));
  }

  async create(
    projectId: string,
    body: CreateAppPageLinkDto,
  ): Promise<AppPageLinkData> {
    await this.projects.assertExists(projectId);
    await this.assertPagesExist(projectId, body.sourcePageId, body.targetPageId);

    if (body.sourcePageId === body.targetPageId) {
      throw new BadRequestException('Source and target page must differ');
    }

    try {
      const doc = await this.linkModel.create({
        projectId,
        sourcePageId: body.sourcePageId,
        targetPageId: body.targetPageId,
        label: body.label,
      });
      return this.toData(doc);
    } catch (error) {
      if (this.isDuplicateLinkError(error)) {
        throw new ConflictException('Link between these pages already exists');
      }
      throw error;
    }
  }

  async update(
    projectId: string,
    linkId: string,
    body: UpdateAppPageLinkDto,
  ): Promise<AppPageLinkData> {
    const doc = await this.require(projectId, linkId);
    if (body.label !== undefined) {
      doc.label = body.label;
    }
    await doc.save();
    return this.toData(doc);
  }

  async remove(projectId: string, linkId: string): Promise<{ id: string }> {
    const doc = await this.linkModel
      .findOneAndDelete(withProjectId(projectId, { _id: linkId }))
      .exec();
    if (!doc) {
      throw new NotFoundException(`App page link ${linkId} not found`);
    }
    return { id: doc._id.toString() };
  }

  async removeLinksForPage(projectId: string, pageId: string): Promise<void> {
    await this.linkModel
      .deleteMany(
        withProjectId(projectId, {
          $or: [{ sourcePageId: pageId }, { targetPageId: pageId }],
        }),
      )
      .exec();
  }

  private async require(
    projectId: string,
    linkId: string,
  ): Promise<AppPageLinkDocument> {
    if (!Types.ObjectId.isValid(linkId)) {
      throw new NotFoundException(`App page link ${linkId} not found`);
    }
    const doc = await this.linkModel
      .findOne(withProjectId(projectId, { _id: linkId }))
      .exec();
    if (!doc) {
      throw new NotFoundException(`App page link ${linkId} not found`);
    }
    return doc;
  }

  private async assertPagesExist(
    projectId: string,
    sourcePageId: string,
    targetPageId: string,
  ): Promise<void> {
    await this.requirePage(projectId, sourcePageId);
    await this.requirePage(projectId, targetPageId);
  }

  private async requirePage(
    projectId: string,
    pageId: string,
  ): Promise<AppPageDocument> {
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

  private toData(doc: AppPageLinkDocument): AppPageLinkData {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      sourcePageId: doc.sourcePageId,
      targetPageId: doc.targetPageId,
      label: doc.label,
    };
  }

  private isDuplicateLinkError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}
