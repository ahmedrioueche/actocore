import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StudioAccount,
  StudioAccountDocument,
} from './schemas/studio-account.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { StudioAdminEmailsService } from './studio-admin-emails.service';
import { StudioEmailService } from './studio-email.service';
import { normalizeAccountPreferences } from './utils/account-preferences.util';

const FAILURE_COOLDOWN_MS = 60 * 60 * 1000;

export type FailureAlertCategory = 'llm' | 'billing';

@Injectable()
export class StudioAdminNotificationService {
  private readonly logger = new Logger(StudioAdminNotificationService.name);

  constructor(
    private readonly email: StudioEmailService,
    private readonly adminEmails: StudioAdminEmailsService,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async maybeNotifyFailureForProject(
    projectId: string,
    category: FailureAlertCategory,
    subject: string,
    body: string,
  ): Promise<void> {
    const project = await this.projectModel
      .findById(projectId)
      .select('accountId')
      .exec();
    if (!project?.accountId) {
      return;
    }
    await this.maybeNotifyFailure(project.accountId, category, subject, body);
  }

  async maybeNotifyFailure(
    accountId: string,
    category: FailureAlertCategory,
    subject: string,
    body: string,
  ): Promise<void> {
    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      return;
    }

    const prefs = normalizeAccountPreferences(account.preferences);
    if (prefs.failureAlertEmails === false) {
      return;
    }

    const cooldowns = account.failureAlertCooldowns ?? {};
    const lastSent = cooldowns[category];
    if (lastSent && Date.now() - lastSent.getTime() < FAILURE_COOLDOWN_MS) {
      return;
    }

    const emails = await this.adminEmails.resolveForAccount(accountId);
    if (emails.length === 0) {
      this.logger.warn(
        `No admin email for ${category} failure alert on account ${accountId}`,
      );
      return;
    }

    for (const to of emails) {
      await this.email.sendQuotaAlert(to, subject, body);
    }

    account.failureAlertCooldowns = { ...cooldowns, [category]: new Date() };
    await account.save();
  }
}
