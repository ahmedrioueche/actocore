import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  ActionData,
  Paginated,
  PaginationQuery,
  SdkConfigAuditEntryData,
  SdkProjectConfigData,
  UpdateSdkProjectConfigDto,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { SdkConfigAuditLogger } from './sdk-config-audit.logger';
import {
  assertSdkConfigLimits,
  deepMergeSdkConfig,
  emptySdkProjectConfig,
  normalizeSdkConfig,
} from './sanitize-sdk-config.util';

@Injectable()
export class SdkConfigService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly audit: SdkConfigAuditLogger,
  ) {}

  async getConfig(projectId: string): Promise<SdkProjectConfigData> {
    const doc = await this.requireProject(projectId);
    return normalizeSdkConfig(doc.sdkConfig);
  }

  async updateConfig(
    projectId: string,
    patch: UpdateSdkProjectConfigDto,
  ): Promise<SdkProjectConfigData> {
    const doc = await this.requireProject(projectId);
    const current = normalizeSdkConfig(doc.sdkConfig);
    const merged = deepMergeSdkConfig(current, patch);

    try {
      assertSdkConfigLimits(merged);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid SDK config',
      );
    }

    merged.sdkConfigVersion = current.sdkConfigVersion + 1;
    doc.sdkConfig = merged;
    await doc.save();

    await this.audit.log({
      projectId,
      sdkConfigVersion: merged.sdkConfigVersion,
      changedSections: this.changedSections(patch),
    });

    return merged;
  }

  listAudit(projectId: string, limit?: number) {
    return this.audit.listForProject(projectId, limit);
  }

  listAuditPaginated(
    projectId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<SdkConfigAuditEntryData>> {
    return this.audit.listForProjectPaginated(projectId, query);
  }

  /** Filters enabled actions when a dashboard allowlist (names or sections) is configured. */
  filterEnabledActions(
    projectId: string,
    enabled: ActionData[],
    sdkConfig?: SdkProjectConfigData,
  ): ActionData[] {
    const config = sdkConfig ?? emptySdkProjectConfig();
    const allowedNames = config.security?.allowedActionNames;
    const allowedSections = config.security?.allowedSectionIds;
    if (!allowedNames?.length && !allowedSections?.length) {
      return enabled;
    }

    const names = new Set(allowedNames ?? []);
    const sections = new Set(allowedSections ?? []);
    return enabled.filter(
      (action) =>
        names.has(action.name) ||
        (action.sectionId != null && sections.has(action.sectionId)),
    );
  }

  private changedSections(patch: UpdateSdkProjectConfigDto): string[] {
    return (['i18n', 'theme', 'security', 'ui', 'voice'] as const).filter(
      (key) => patch[key] !== undefined,
    );
  }

  private async requireProject(projectId: string): Promise<ProjectDocument> {
    const doc = await this.projectModel.findById(projectId).exec();
    if (!doc) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    return doc;
  }
}
