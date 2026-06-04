import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  StudioAccountPreferences,
  StudioAccountSettingsData,
  UpdateStudioAccountDto,
  UpdateStudioAccountPreferencesDto,
} from '@ahmedrioueche/actocore-shared';
import { ErrorCode, StudioRole } from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import type { StudioRequestContext } from './studio-context';
import {
  StudioAccount,
  StudioAccountDocument,
  StudioAccountPreferencesSchema,
} from './schemas/studio-account.schema';

@Injectable()
export class StudioAccountService {
  constructor(
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
  ) {}

  async getSettings(ctx: StudioRequestContext): Promise<StudioAccountSettingsData> {
    const account = await this.requireAccount(ctx.accountId);
    return this.toSettingsData(account);
  }

  async updateSettings(
    ctx: StudioRequestContext,
    body: UpdateStudioAccountDto,
  ): Promise<StudioAccountSettingsData> {
    this.assertAccountAdmin(ctx);
    const account = await this.requireAccount(ctx.accountId);

    if (body.name !== undefined) {
      account.name = body.name.trim();
    }
    if (body.billingEmail !== undefined) {
      account.billingEmail = body.billingEmail.trim().toLowerCase();
    }
    if (body.timezone !== undefined) {
      account.timezone = body.timezone.trim() || undefined;
    }
    if (body.defaultLocale !== undefined) {
      account.defaultLocale = body.defaultLocale.trim() || undefined;
    }

    await account.save();
    return this.toSettingsData(account);
  }

  async getPreferences(
    ctx: StudioRequestContext,
  ): Promise<StudioAccountPreferences> {
    const account = await this.requireAccount(ctx.accountId);
    return this.toPreferences(account.preferences);
  }

  async updatePreferences(
    ctx: StudioRequestContext,
    body: UpdateStudioAccountPreferencesDto,
  ): Promise<StudioAccountPreferences> {
    this.assertAccountAdmin(ctx);
    const account = await this.requireAccount(ctx.accountId);

    if (!account.preferences) {
      account.preferences = new StudioAccountPreferencesSchema();
    }
    if (body.quotaAlertEmails !== undefined) {
      account.preferences.quotaAlertEmails = body.quotaAlertEmails;
    }
    if (body.billingEmails !== undefined) {
      account.preferences.billingEmails = body.billingEmails;
    }
    if (body.productEmails !== undefined) {
      account.preferences.productEmails = body.productEmails;
    }
    if (body.quotaWebhookUrl !== undefined) {
      const url = body.quotaWebhookUrl.trim();
      account.preferences.quotaWebhookUrl = url || undefined;
    }

    await account.save();
    return this.toPreferences(account.preferences);
  }

  toAccountSummary(doc: StudioAccountDocument) {
    return {
      id: doc._id.toString(),
      name: doc.name,
      billingEmail: doc.billingEmail,
      timezone: doc.timezone,
      defaultLocale: doc.defaultLocale,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private async requireAccount(accountId: string): Promise<StudioAccountDocument> {
    if (!Types.ObjectId.isValid(accountId)) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Workspace not found',
      });
    }
    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      throw new NotFoundException({
        errorCode: ErrorCode.NOT_FOUND,
        message: 'Workspace not found',
      });
    }
    return account;
  }

  private assertAccountAdmin(ctx: StudioRequestContext): void {
    if (
      ctx.role !== StudioRole.USER_ADMIN &&
      ctx.role !== StudioRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException({
        errorCode: ErrorCode.INSUFFICIENT_PERMISSIONS,
        message: 'Workspace admin access required',
      });
    }
  }

  private toSettingsData(doc: StudioAccountDocument): StudioAccountSettingsData {
    return {
      id: doc._id.toString(),
      name: doc.name,
      billingEmail: doc.billingEmail,
      timezone: doc.timezone,
      defaultLocale: doc.defaultLocale,
      preferences: this.toPreferences(doc.preferences),
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    };
  }

  private toPreferences(
    prefs?: StudioAccountPreferencesSchema,
  ): StudioAccountPreferences {
    return {
      quotaAlertEmails: prefs?.quotaAlertEmails ?? true,
      billingEmails: prefs?.billingEmails ?? true,
      productEmails: prefs?.productEmails ?? false,
      quotaWebhookUrl: prefs?.quotaWebhookUrl,
    };
  }
}
