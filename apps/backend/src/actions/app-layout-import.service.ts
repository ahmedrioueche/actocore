import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  AppLayoutExportFunctionality,
  AppLayoutExportV1,
  AppLayoutImportResult,
  ImportAppLayoutDto,
} from '@ahmedrioueche/actocore-shared';
import {
  sortAppLayoutPagesTopologically,
  validateAppLayoutExport,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ProjectsService } from '../projects/projects.service';
import { AppPagesService } from './app-pages.service';
import { AppPage, AppPageDocument } from './schemas/app-page.schema';
import {
  AppPageLink,
  AppPageLinkDocument,
} from './schemas/app-page-link.schema';
import {
  ProjectAction,
  ProjectActionDocument,
} from './schemas/project-action.schema';

const MAX_FUNCTIONALITIES_PER_PAGE = 20;

@Injectable()
export class AppLayoutImportService {
  constructor(
    @InjectModel(AppPage.name)
    private readonly pageModel: Model<AppPageDocument>,
    @InjectModel(AppPageLink.name)
    private readonly linkModel: Model<AppPageLinkDocument>,
    @InjectModel(ProjectAction.name)
    private readonly actionModel: Model<ProjectActionDocument>,
    private readonly projects: ProjectsService,
    private readonly pages: AppPagesService,
  ) {}

  async importLayout(
    projectId: string,
    body: ImportAppLayoutDto,
  ): Promise<AppLayoutImportResult> {
    await this.projects.assertExists(projectId);

    const validation = validateAppLayoutExport(body.layout);
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    const warnings = [...validation.warnings];
    let created = 0;
    let updated = 0;

    if (body.mode === 'replace') {
      await this.clearLayout(projectId);
    }

    const actionNameToId = await this.loadActionNameMap(projectId);
    const slugToId = await this.loadSlugMap(projectId);

    const sortedPages = sortAppLayoutPagesTopologically(body.layout.pages);

    for (const pageEntry of sortedPages) {
      const parentPageId = pageEntry.parentPageSlug?.trim()
        ? slugToId.get(pageEntry.parentPageSlug.trim())
        : undefined;

      if (pageEntry.parentPageSlug?.trim() && !parentPageId) {
        throw new BadRequestException(
          `Parent page "${pageEntry.parentPageSlug}" not found while importing "${pageEntry.slug}"`,
        );
      }

      const functionalities = this.resolveFunctionalities(
        pageEntry.functionalities,
        actionNameToId,
        pageEntry.slug,
        warnings,
      );

      const existingId = slugToId.get(pageEntry.slug);
      const pageKind = pageEntry.pageKind ?? 'screen';

      if (existingId) {
        const $set: Record<string, unknown> = {
          title: pageEntry.title,
          route: pageEntry.route,
          pageKind,
          description: pageEntry.description,
          enabled: pageEntry.enabled ?? true,
          order: pageEntry.order ?? 0,
          graphPosition: pageEntry.graphPosition,
          functionalities,
        };
        const update: Record<string, unknown> = { $set };
        if (parentPageId) {
          $set.parentPageId = parentPageId;
        } else {
          update.$unset = { parentPageId: '' };
        }

        await this.pageModel
          .updateOne(withProjectId(projectId, { _id: existingId }), update)
          .exec();
        updated += 1;
      } else {
        const doc = await this.pageModel.create({
          projectId,
          slug: pageEntry.slug,
          title: pageEntry.title,
          route: pageEntry.route,
          pageKind,
          description: pageEntry.description,
          enabled: pageEntry.enabled ?? true,
          order: pageEntry.order ?? 0,
          parentPageId,
          graphPosition: pageEntry.graphPosition,
          functionalities,
        });
        slugToId.set(pageEntry.slug, doc._id.toString());
        created += 1;
      }
    }

    await this.syncLinks(projectId, body.layout, slugToId, body.mode, warnings);

    if (body.includeActionAssignments && body.layout.actionAssignments) {
      await this.syncActionAssignments(
        projectId,
        body.layout.actionAssignments,
        slugToId,
        actionNameToId,
        warnings,
      );
    }

    return {
      created,
      updated,
      skipped: 0,
      warnings,
    };
  }

  private async clearLayout(projectId: string): Promise<void> {
    await this.linkModel.deleteMany(withProjectId(projectId)).exec();
    await this.pageModel.deleteMany(withProjectId(projectId)).exec();
    await this.actionModel
      .updateMany(withProjectId(projectId), { $set: { pageIds: [] } })
      .exec();
  }

  private async loadSlugMap(projectId: string): Promise<Map<string, string>> {
    const docs = await this.pageModel
      .find(withProjectId(projectId))
      .select('_id slug')
      .exec();
    return new Map(docs.map((doc) => [doc.slug, doc._id.toString()] as const));
  }

  private async loadActionNameMap(
    projectId: string,
  ): Promise<Map<string, string>> {
    const docs = await this.actionModel
      .find(withProjectId(projectId))
      .select('_id name')
      .exec();
    return new Map(docs.map((doc) => [doc.name, doc._id.toString()] as const));
  }

  private resolveFunctionalities(
    entries: AppLayoutExportFunctionality[] | undefined,
    actionNameToId: Map<string, string>,
    pageSlug: string,
    warnings: string[],
  ) {
    if (!entries?.length) {
      return [];
    }

    if (entries.length > MAX_FUNCTIONALITIES_PER_PAGE) {
      throw new BadRequestException(
        `Page "${pageSlug}" exceeds ${MAX_FUNCTIONALITIES_PER_PAGE} functionalities`,
      );
    }

    return entries.map((entry) => {
      let linkedActionId: string | undefined;
      if (entry.linkedActionName?.trim()) {
        linkedActionId = actionNameToId.get(entry.linkedActionName.trim());
        if (!linkedActionId) {
          warnings.push(
            `Action "${entry.linkedActionName}" not found — skipped functionality link on page "${pageSlug}"`,
          );
        }
      }

      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        linkedActionId,
      };
    });
  }

  private async syncLinks(
    projectId: string,
    layout: AppLayoutExportV1,
    slugToId: Map<string, string>,
    mode: ImportAppLayoutDto['mode'],
    warnings: string[],
  ): Promise<void> {
    if (mode === 'replace') {
      await this.linkModel.deleteMany(withProjectId(projectId)).exec();
    }

    for (const link of layout.links) {
      const sourcePageId = slugToId.get(link.sourceSlug);
      const targetPageId = slugToId.get(link.targetSlug);
      if (!sourcePageId || !targetPageId) {
        warnings.push(
          `Skipped link ${link.sourceSlug} → ${link.targetSlug}: page not found`,
        );
        continue;
      }

      const existing = await this.linkModel
        .findOne(
          withProjectId(projectId, {
            sourcePageId,
            targetPageId,
          }),
        )
        .exec();

      if (existing) {
        if (link.label !== undefined) {
          existing.label = link.label;
          await existing.save();
        }
      } else {
        await this.linkModel.create({
          projectId,
          sourcePageId,
          targetPageId,
          label: link.label,
        });
      }
    }
  }

  private async syncActionAssignments(
    projectId: string,
    assignments: Record<string, string[]>,
    slugToId: Map<string, string>,
    actionNameToId: Map<string, string>,
    warnings: string[],
  ): Promise<void> {
    for (const [pageSlug, actionNames] of Object.entries(assignments)) {
      const pageId = slugToId.get(pageSlug);
      if (!pageId) {
        continue;
      }

      const actionIds: string[] = [];
      for (const name of actionNames) {
        const actionId = actionNameToId.get(name);
        if (actionId) {
          actionIds.push(actionId);
        } else {
          warnings.push(
            `Action "${name}" not found — skipped for page "${pageSlug}"`,
          );
        }
      }

      await this.pages.assignActions(projectId, pageId, {
        actionIds: [...new Set(actionIds)],
      });
    }
  }
}
