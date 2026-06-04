import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { StudioTeamAuditEntryData } from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import type { StudioRequestContext } from './studio-context';
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

    return docs.map((doc) => ({
      id: doc._id.toString(),
      accountId: doc.accountId,
      action: doc.action,
      targetUserId: doc.targetUserId,
      actorUserId: doc.actorUserId,
      meta: doc.meta,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
    }));
  }
}
