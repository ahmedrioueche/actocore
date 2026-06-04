import { Injectable, Optional, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  AccountQuotaStatusData,
  ProjectQuotaStatusData,
} from '@ahmedrioueche/actocore-shared';
import type { QuotaLimits } from '../config/quota.config';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { RedisService } from '../redis/redis.service';
import { StudioEntitlementsService } from '../studio-billing/studio-entitlements.service';
import { QuotaExceededException } from './exceptions/quota.exception';
import { QuotaAlertService } from './quota-alert.service';
import { UsageService } from '../usage/usage.service';

interface MemoryCounter {
  count: number;
  expiresAt: number;
}

@Injectable()
export class QuotaService {
  private readonly memoryCounters = new Map<string, MemoryCounter>();

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly usage: UsageService,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @Optional()
    @Inject(forwardRef(() => StudioEntitlementsService))
    private readonly entitlements?: StudioEntitlementsService,
    @Optional()
    @Inject(forwardRef(() => QuotaAlertService))
    private readonly quotaAlerts?: QuotaAlertService,
  ) {}

  async getAccountQuotaStatus(accountId: string): Promise<AccountQuotaStatusData> {
    const limits = this.config.getOrThrow<QuotaLimits>('quota');
    const monthlyLimit = await this.resolveAccountMonthlyLimit(accountId);
    let monthlyChatUsed = 0;
    if (this.entitlements) {
      monthlyChatUsed =
        await this.entitlements.countAccountMonthlyChatUsage(accountId);
    }

    let limitsSource: AccountQuotaStatusData['limitsSource'] = 'env';
    let monthlyChatLimit: number | null = limits.enabled ? limits.chatPerMonth : null;

    if (monthlyLimit != null) {
      monthlyChatLimit = monthlyLimit;
      limitsSource = 'plan';
    } else if (!limits.enabled) {
      limitsSource = 'none';
      monthlyChatLimit = null;
    }

    const percentUsed =
      monthlyChatLimit != null && monthlyChatLimit > 0
        ? Math.min(100, Math.floor((monthlyChatUsed / monthlyChatLimit) * 100))
        : null;

    return {
      accountId,
      enforced: limits.enabled,
      monthlyChatUsed,
      monthlyChatLimit,
      percentUsed,
      limitsSource,
      perMinuteLimit: limits.chatPerMinute,
      perDayLimit: limits.chatPerDay,
      alertPercentages: limits.alertPercentages,
    };
  }

  async getProjectQuotaStatus(projectId: string): Promise<ProjectQuotaStatusData> {
    const project = await this.projectModel
      .findById(projectId)
      .select('accountId')
      .lean()
      .exec();

    if (!project?.accountId || project.accountId === 'legacy') {
      const limits = this.config.getOrThrow<QuotaLimits>('quota');
      const monthlyChatUsed = await this.usage.countChatRequestsThisMonth(projectId);
      return {
        projectId,
        enforced: limits.enabled,
        monthlyChatUsed,
        monthlyChatLimit: limits.enabled ? limits.chatPerMonth : null,
        limitsSource: 'env',
        perMinuteLimit: limits.chatPerMinute,
        perDayLimit: limits.chatPerDay,
      };
    }

    const accountStatus = await this.getAccountQuotaStatus(project.accountId);
    return {
      projectId,
      enforced: accountStatus.enforced,
      monthlyChatUsed: accountStatus.monthlyChatUsed,
      monthlyChatLimit: accountStatus.monthlyChatLimit,
      limitsSource: accountStatus.limitsSource,
      perMinuteLimit: accountStatus.perMinuteLimit,
      perDayLimit: accountStatus.perDayLimit,
    };
  }

  async consumeChatQuota(projectId: string): Promise<void> {
    const limits = this.config.getOrThrow<QuotaLimits>('quota');
    if (!limits.enabled) {
      return;
    }

    const accountLimit = await this.resolveAccountMonthlyLimit(projectId);
    const monthlyCap = accountLimit ?? limits.chatPerMonth;

    if (accountLimit != null) {
      await this.assertAccountMonthlyQuota(projectId, monthlyCap);
    } else {
      await this.assertMonthlyQuota(projectId, monthlyCap);
    }

    await this.consumeWindow(
      projectId,
      'minute',
      limits.chatPerMinute,
      60,
    );
    await this.consumeWindow(projectId, 'day', limits.chatPerDay, 86_400);

    await this.notifyAfterConsume(projectId);
  }

  private async notifyAfterConsume(projectId: string): Promise<void> {
    if (!this.quotaAlerts || !this.entitlements) {
      return;
    }
    const project = await this.projectModel
      .findById(projectId)
      .select('accountId')
      .lean()
      .exec();
    if (!project?.accountId || project.accountId === 'legacy') {
      return;
    }
    try {
      await this.quotaAlerts.maybeNotifyMonthlyThresholds(project.accountId);
    } catch {
      // Non-blocking: chat must succeed even if email fails
    }
  }

  private async resolveAccountMonthlyLimit(
    projectId: string,
  ): Promise<number | null> {
    if (!this.entitlements) {
      return null;
    }
    const project = await this.projectModel
      .findById(projectId)
      .select('accountId')
      .lean()
      .exec();
    if (!project?.accountId || project.accountId === 'legacy') {
      return null;
    }
    return this.entitlements.resolveMonthlyChatQuota(project.accountId);
  }

  private async assertAccountMonthlyQuota(
    projectId: string,
    limit: number,
  ): Promise<void> {
    if (!this.entitlements) {
      return this.assertMonthlyQuota(projectId, limit);
    }
    const project = await this.projectModel
      .findById(projectId)
      .select('accountId')
      .lean()
      .exec();
    if (!project?.accountId || project.accountId === 'legacy') {
      return this.assertMonthlyQuota(projectId, limit);
    }
    const count = await this.entitlements.countAccountMonthlyChatUsage(
      project.accountId,
    );
    if (count >= limit) {
      throw new QuotaExceededException({
        window: 'monthly',
        message: `Monthly chat quota exceeded for account (${count}/${limit})`,
      });
    }
  }

  private async assertMonthlyQuota(
    projectId: string,
    limit: number,
  ): Promise<void> {
    const count = await this.usage.countChatRequestsThisMonth(projectId);
    if (count >= limit) {
      throw new QuotaExceededException({
        window: 'monthly',
        message: `Monthly chat quota exceeded for project (${count}/${limit})`,
      });
    }
  }

  private async consumeWindow(
    projectId: string,
    window: 'minute' | 'day',
    limit: number,
    ttlSeconds: number,
  ): Promise<void> {
    const bucket = this.bucketKey(window);
    const key = `quota:${projectId}:chat:${window}:${bucket}`;
    const count = await this.increment(key, ttlSeconds);

    if (count > limit) {
      throw new QuotaExceededException({
        window,
        message: `${window} chat quota exceeded (${count}/${limit})`,
      });
    }
  }

  private bucketKey(window: 'minute' | 'day'): string {
    const now = new Date();
    if (window === 'minute') {
      return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
    }
    return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  }

  private async increment(key: string, ttlSeconds: number): Promise<number> {
    const client = this.redis.getClient();
    if (client) {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, ttlSeconds);
      }
      return count;
    }

    return this.incrementMemory(key, ttlSeconds);
  }

  private incrementMemory(key: string, ttlSeconds: number): number {
    const now = Date.now();
    const existing = this.memoryCounters.get(key);

    if (!existing || existing.expiresAt <= now) {
      const entry = { count: 1, expiresAt: now + ttlSeconds * 1000 };
      this.memoryCounters.set(key, entry);
      return 1;
    }

    existing.count += 1;
    return existing.count;
  }
}
