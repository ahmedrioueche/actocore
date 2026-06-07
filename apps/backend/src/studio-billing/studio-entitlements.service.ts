import { ForbiddenException, Injectable } from '@nestjs/common';
import { ErrorCode } from '@ahmedrioueche/actocore-shared';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import {
  StudioMembership,
  StudioMembershipDocument,
} from '../studio/schemas/studio-membership.schema';
import { UsageService } from '../usage/usage.service';
import { StudioSubscriptionService } from './studio-subscription.service';

@Injectable()
export class StudioEntitlementsService {
  constructor(
    private readonly subscriptions: StudioSubscriptionService,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(StudioMembership.name)
    private readonly membershipModel: Model<StudioMembershipDocument>,
    private readonly usage: UsageService,
  ) {}

  async assertCanCreateProject(accountId: string): Promise<void> {
    const summary = await this.subscriptions.getSummary(accountId);
    const max = summary.limits.maxProjects;
    if (max == null) {
      return;
    }
    if (summary.usage && summary.usage.projectsUsed >= max) {
      throw new ForbiddenException({
        errorCode: ErrorCode.PROJECT_LIMIT_REACHED,
        message: `Project limit reached (${max}). Upgrade your plan.`,
        details: {
          limit: max,
          used: summary.usage.projectsUsed,
        },
      });
    }
  }

  async assertCanAddTeamMember(accountId: string): Promise<void> {
    const summary = await this.subscriptions.getSummary(accountId);
    const max = summary.limits.maxTeamSeats;
    if (max == null) {
      return;
    }
    if (summary.usage && summary.usage.teamSeatsUsed >= max) {
      throw new ForbiddenException({
        errorCode: ErrorCode.SEAT_LIMIT_REACHED,
        message: `Team seat limit reached (${max}). Upgrade your plan.`,
        details: {
          limit: max,
          used: summary.usage.teamSeatsUsed,
        },
      });
    }
  }

  async resolveMonthlyChatQuota(accountId: string): Promise<number | null> {
    const summary = await this.subscriptions.getSummary(accountId);
    const planLimit = summary.limits.monthlyChatQuota;
    return planLimit != null && planLimit > 0 ? planLimit : null;
  }

  async countAccountMonthlyChatUsage(accountId: string): Promise<number> {
    const projects = await this.projectModel
      .find({ accountId })
      .select('_id')
      .exec();
    const ids = projects.map((p) => p._id.toString());
    return this.usage.countChatRequestsThisMonthForAccount(accountId, ids);
  }
}
