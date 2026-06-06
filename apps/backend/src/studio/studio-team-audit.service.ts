import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  Paginated,
  PaginationQuery,
  StudioTeamAuditEntryData,
} from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import type { StudioRequestContext } from './studio-context';
import {
  normalizePagination,
  paginate,
} from '../common/pagination/pagination.util';
import {
  StudioTeamAudit,
  StudioTeamAuditAction,
  StudioTeamAuditDocument,
} from './schemas/studio-team-audit.schema';

@Injectable()
export class StudioTeamAuditService {
  constructor(
    @InjectModel(StudioTeamAudit.name)
    private readonly auditModel: Model<StudioTeamAuditDocument>,
  ) {}

  async log(
    ctx: StudioRequestContext,
    action: StudioTeamAuditAction,
    targetUserId: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditModel.create({
      accountId: ctx.accountId,
      action,
      targetUserId,
      actorUserId: ctx.userId,
      meta,
    });
  }

  async list(
    accountId: string,
    limit = 50,
  ): Promise<StudioTeamAuditEntryData[]> {
    const docs = await this.auditModel
      .find({ accountId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200))
      .exec();

    return docs.map((doc) => this.toData(doc));
  }

  /** Paginated variant used by the Studio team audit route. */
  async listPaginated(
    accountId: string,
    query: PaginationQuery = {},
  ): Promise<Paginated<StudioTeamAuditEntryData>> {
    const { page, limit, skip } = normalizePagination(query);
    const filter = { accountId };

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

  private toData(doc: StudioTeamAuditDocument): StudioTeamAuditEntryData {
    return {
      id: doc._id.toString(),
      accountId: doc.accountId,
      action: doc.action,
      targetUserId: doc.targetUserId,
      actorUserId: doc.actorUserId,
      meta: doc.meta,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
    };
  }
}
