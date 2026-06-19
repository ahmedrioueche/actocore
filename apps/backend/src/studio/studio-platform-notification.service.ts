import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { AppSubscriptionBillingCycle } from '@ahmedrioueche/actocore-shared';
import { isStudioTestAccountEmail } from '@ahmedrioueche/actocore-shared';
import { Model } from 'mongoose';
import type { StudioAuthConfig } from '../config/studio-auth.config';
import { isPlaygroundAccountId } from '../config/playground.config';
import { StudioPlanModel } from '../studio-billing/schemas/billing.schema';
import { StudioAccount, StudioAccountDocument } from './schemas/studio-account.schema';
import { StudioEmailService } from './studio-email.service';

export type PlatformSignupMethod = 'email' | 'google';

export type PlatformSubscriptionNotifyContext = {
  action: string;
  planId: string;
  billingCycle?: AppSubscriptionBillingCycle;
  periodEnd?: Date;
  pendingPlanId?: string;
  details?: string;
};

@Injectable()
export class StudioPlatformNotificationService {
  private readonly logger = new Logger(StudioPlatformNotificationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly email: StudioEmailService,
    @InjectModel(StudioAccount.name)
    private readonly accountModel: Model<StudioAccountDocument>,
    @InjectModel(StudioPlanModel.name)
    private readonly planModel: Model<StudioPlanModel>,
  ) {}

  /** Fire-and-forget — never throws. */
  notifyUserSignup(input: {
    email: string;
    displayName?: string;
    accountName: string;
    accountId: string;
    method: PlatformSignupMethod;
  }): void {
    if (isStudioTestAccountEmail(input.email)) {
      return;
    }

    void this.deliver('New user signup', [
      `Method: ${input.method === 'google' ? 'Google OAuth' : 'Email & password'}`,
      `Email: ${input.email}`,
      `Display name: ${input.displayName?.trim() || '(not set)'}`,
      `Workspace: ${input.accountName}`,
      `Account ID: ${input.accountId}`,
    ]).catch((error) => this.logFailure('user signup', error));
  }

  /** Fire-and-forget — never throws. */
  notifyProjectCreated(input: {
    projectId: string;
    projectName: string;
    accountId: string;
    createdByEmail?: string;
    source?: 'signup_default' | 'user';
  }): void {
    if (isPlaygroundAccountId(input.accountId)) {
      return;
    }
    if (input.createdByEmail && isStudioTestAccountEmail(input.createdByEmail)) {
      return;
    }

    const sourceLabel =
      input.source === 'signup_default'
        ? 'Default project on signup'
        : 'User created';

    void this.deliver('New project created', [
      `Project: ${input.projectName}`,
      `Project ID: ${input.projectId}`,
      `Account ID: ${input.accountId}`,
      `Source: ${sourceLabel}`,
      `Created by: ${input.createdByEmail?.trim() || '(unknown)'}`,
    ]).catch((error) => this.logFailure('project created', error));
  }

  /** Fire-and-forget — never throws. */
  notifySubscriptionEvent(
    accountId: string,
    context: PlatformSubscriptionNotifyContext,
  ): void {
    void this.deliverSubscription(accountId, context).catch((error) =>
      this.logFailure(`subscription ${context.action}`, error),
    );
  }

  private async deliverSubscription(
    accountId: string,
    context: PlatformSubscriptionNotifyContext,
  ): Promise<void> {
    const account = await this.accountModel
      .findById(accountId)
      .select('name')
      .exec();
    if (!account) {
      return;
    }

    const planName = await this.resolvePlanName(context.planId);
    const pendingPlanName = context.pendingPlanId
      ? await this.resolvePlanName(context.pendingPlanId)
      : undefined;
    const { eventLabel, lines } = buildPlatformSubscriptionMessage(
      context,
      account.name,
      accountId,
      planName,
      pendingPlanName,
    );

    await this.deliver(eventLabel, lines);
  }

  private async deliver(
    eventLabel: string,
    lines: string[],
  ): Promise<void> {
    const inbox = this.resolveInbox();
    if (!inbox) {
      return;
    }
    await this.email.sendPlatformActivity(inbox, eventLabel, lines);
  }

  private resolveInbox(): string | null {
    const cfg = this.cfg();
    if (!cfg.platformNotifyEnabled) {
      return null;
    }
    const inbox = cfg.platformNotifyEmail.trim();
    return inbox || null;
  }

  private async resolvePlanName(planId: string): Promise<string> {
    const plan = await this.planModel.findOne({ planId }).select('name').exec();
    return plan?.name ?? planId;
  }

  private cfg(): StudioAuthConfig {
    return this.config.getOrThrow<StudioAuthConfig>('studioAuth');
  }

  private logFailure(event: string, error: unknown): void {
    this.logger.warn(
      `Platform activity email failed (${event}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function buildPlatformSubscriptionMessage(
  context: PlatformSubscriptionNotifyContext,
  accountName: string,
  accountId: string,
  planName: string,
  pendingPlanName?: string,
): { eventLabel: string; lines: string[] } {
  const cycle =
    context.billingCycle === 'yearly'
      ? 'yearly'
      : context.billingCycle === 'monthly'
        ? 'monthly'
        : 'n/a';
  const periodEnd = formatPlatformDate(context.periodEnd);

  const base = [
    `Workspace: ${accountName}`,
    `Account ID: ${accountId}`,
    `Plan: ${planName}`,
    `Billing cycle: ${cycle}`,
    ...(periodEnd ? [`Period end: ${periodEnd}`] : []),
    ...(context.details ? [`Details: ${context.details}`] : []),
  ];

  switch (context.action) {
    case 'subscribed':
      return {
        eventLabel: 'New subscription',
        lines: [...base, 'Event: Subscription activated'],
      };
    case 'trial_started':
      return {
        eventLabel: 'Free trial started',
        lines: [...base, 'Event: Trial started'],
      };
    case 'trial_ended':
      return {
        eventLabel: 'Free trial ended',
        lines: [...base, 'Event: Trial ended'],
      };
    case 'cancelled':
      return {
        eventLabel: 'Subscription cancellation',
        lines: [...base, 'Event: Cancellation scheduled'],
      };
    case 'reactivated':
      return {
        eventLabel: 'Subscription reactivated',
        lines: [...base, 'Event: Auto-renew restored'],
      };
    case 'upgraded':
      return {
        eventLabel: 'Plan upgrade scheduled',
        lines: [
          ...base,
          ...(pendingPlanName ? [`Pending plan: ${pendingPlanName}`] : []),
          'Event: Upgrade scheduled',
        ],
      };
    default:
      return {
        eventLabel: 'Subscription update',
        lines: [...base, `Event: ${context.action}`],
      };
  }
}

function formatPlatformDate(value?: Date): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.toISOString();
}
