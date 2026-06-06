import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  Paginated,
  PaginationQuery,
  SdkConfigAuditEntryData,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import {
  normalizePagination,
  paginate,
} from '../../common/pagination/pagination.util';
import {
  SdkConfigAudit,
  SdkConfigAuditDocument,
} from '../schemas/sdk-config-audit.schema';

export interface SdkConfigAuditEntry {
  projectId: string;
  sdkConfigVersion: number;
  changedSections: string[];
  actor?: string;
}

@Injectable()
export class SdkConfigAuditLogger {
  private readonly logger = new Logger('SdkConfigAudit');

  constructor(
    @InjectModel(SdkConfigAudit.name)
    private readonly auditModel: Model<SdkConfigAuditDocument>,
  ) {}

  async log(entry: SdkConfigAuditEntry): Promise<void> {
    await this.auditModel.create({
      projectId: entry.projectId,
      sdkConfigVersion: entry.sdkConfigVersion,
      changedSections: entry.changedSections,
      actor: entry.actor ?? 'control-plane',
    });

    this.logger.log(
      JSON.stringify({
        event: 'sdk_config.updated',
        projectId: entry.projectId,
        sdkConfigVersion: entry.sdkConfigVersion,
        changedSections: entry.changedSections,
        actor: entry.actor ?? 'control-plane',
      }),
    );
  }

  async listForProject(
    projectId: string,
    limit = 50,
  ): Promise<SdkConfigAuditEntryData[]> {
    const docs = await this.auditModel
      .find({ projectId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .exec();

    return docs.map((doc) => this.toData(doc));
  }

  /** Paginated variant used by the Studio sdk-config audit route. */
  async listForProjectPaginated(
    projectId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<SdkConfigAuditEntryData>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter = { projectId };

    const [docs, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toData(doc)),
      total,
      { page, limit },
    );
  }

  private toData(doc: SdkConfigAuditDocument): SdkConfigAuditEntryData {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId,
      sdkConfigVersion: doc.sdkConfigVersion,
      changedSections: doc.changedSections ?? [],
      actor: doc.actor,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
    };
  }
}
