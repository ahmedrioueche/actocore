import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import type { QuotaLimits } from '../config/quota.config';
import {
  StudioAccount,
  StudioAccountDocument,
} from '../studio/schemas/studio-account.schema';
import { StudioAdminEmailsService } from '../studio/studio-admin-emails.service';
import { StudioEmailService } from '../studio/studio-email.service';
import { StudioQuotaWebhookService } from '../studio/studio-quota-webhook.service';
import { normalizeAccountPreferences } from '../studio/utils/account-preferences.util';
import { StudioEntitlementsService } from '../studio-billing/studio-entitlements.service';
import { quotaOwnerMessage } from './quota-messages.util';

@Injectable()
export class QuotaAlertService {
  private readonly logger = new Logger(QuotaAlertService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly email: StudioEmailService,
    private readonly adminEmails: StudioAdminEmailsService,
    private readonly quotaWebhook: StudioQuotaWebhookService,
    private readonly entitlements: StudioEntitlementsService,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
  ) {}

  /**
   * After a successful chat request, notify account admins when monthly usage
   * crosses configured thresholds (default 80% / 90% / 100%).
   */
  async maybeNotifyMonthlyThresholds(accountId: string): Promise<void> {
    const limits = this.config.getOrThrow<QuotaLimits>('quota');
    if (!limits.enabled) {
      return;
    }

    const planLimit = await this.entitlements.resolveMonthlyTokenQuota(accountId);
    const monthlyLimit =
      planLimit != null && planLimit > 0
        ? planLimit
        : limits.enabled
          ? limits.tokensPerMonth
          : null;
    if (monthlyLimit == null || monthlyLimit <= 0) {
      return;
    }

    const used = await this.entitlements.countAccountMonthlyTokenUsage(accountId);
    const percent = Math.floor((used / monthlyLimit) * 100);
    const thresholds = limits.alertPercentages;

    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      return;
    }

    const prefs = normalizeAccountPreferences(account.preferences);

    const monthKey = currentMonthKey();
    const state = account.quotaAlerts;
    if (state?.monthKey !== monthKey) {
      account.quotaAlerts = {
        monthKey,
        warned80: false,
        warned90: false,
        warned100: false,
      };
    }

    const alerts = account.quotaAlerts!;

    if (percent >= thresholds[2] && !alerts.warned100) {
      alerts.warned100 = true;
      if (prefs.quotaExhaustedEmails !== false) {
        await this.notifyThreshold(
          account,
          used,
          monthlyLimit,
          100,
          'Monthly AI token limit reached',
        );
      }
    } else if (percent >= thresholds[1] && !alerts.warned90) {
      alerts.warned90 = true;
      if (prefs.quotaWarningEmails !== false) {
        await this.notifyThreshold(
          account,
          used,
          monthlyLimit,
          90,
          '90% of monthly AI token allowance used',
        );
      }
    } else if (percent >= thresholds[0] && !alerts.warned80) {
      alerts.warned80 = true;
      if (prefs.quotaWarningEmails !== false) {
        await this.notifyThreshold(
          account,
          used,
          monthlyLimit,
          80,
          '80% of monthly AI token allowance used',
        );
      }
    }

    account.quotaAlerts = alerts;
    await account.save();
  }

  private async notifyThreshold(
    account: StudioAccountDocument,
    used: number,
    limit: number,
    percent: number,
    subject: string,
  ): Promise<void> {
    await this.quotaWebhook.notifyThreshold(account, {
      percent,
      used,
      limit,
      subject,
    });
    await this.notifyAdmins(account, used, limit, percent, subject);
  }

  private async notifyAdmins(
    account: StudioAccountDocument,
    used: number,
    limit: number,
    percent: number,
    subject: string,
  ): Promise<void> {
    const emails = await this.adminEmails.resolveForAccount(account._id.toString());
    if (emails.length === 0) {
      this.logger.warn(`No admin email for quota alert on account ${account._id}`);
      return;
    }

    const body = [
      quotaOwnerMessage('monthly', used, limit),
      '',
      `Your plan allows ${limit} AI tokens per month for all projects in "${account.name}".`,
      percent >= 100
        ? 'New chat requests from your app users may be blocked until the next billing period or you upgrade your plan.'
        : 'Consider upgrading your plan before your end users are affected.',
      '',
      'Manage billing in ActoCore Studio → Billing.',
    ].join('\n');

    for (const to of emails) {
      await this.email.sendQuotaAlert(to, subject, body);
    }
  }

}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}
