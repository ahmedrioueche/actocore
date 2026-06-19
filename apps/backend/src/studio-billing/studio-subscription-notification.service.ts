import type { AppSubscriptionBillingCycle } from '@ahmedrioueche/actocore-shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudioAdminEmailsService } from '../studio/studio-admin-emails.service';
import { StudioEmailService } from '../studio/studio-email.service';
import { StudioPlatformNotificationService } from '../studio/studio-platform-notification.service';
import { StudioPlanModel } from './schemas/billing.schema';

export const SUBSCRIPTION_EMAIL_ACTIONS = [
  'subscribed',
  'trial_started',
  'trial_ended',
  'cancelled',
  'reactivated',
  'upgraded',
] as const;

export type SubscriptionEmailAction =
  (typeof SUBSCRIPTION_EMAIL_ACTIONS)[number];

export type SubscriptionEmailContext = {
  action: SubscriptionEmailAction;
  planId: string;
  billingCycle?: AppSubscriptionBillingCycle;
  periodEnd?: Date;
  pendingPlanId?: string;
  details?: string;
};

@Injectable()
export class StudioSubscriptionNotificationService {
  private readonly logger = new Logger(StudioSubscriptionNotificationService.name);

  constructor(
    private readonly email: StudioEmailService,
    private readonly adminEmails: StudioAdminEmailsService,
    private readonly platformNotifications: StudioPlatformNotificationService,
    @InjectModel(StudioPlanModel.name)
    private readonly planModel: Model<StudioPlanModel>,
  ) {}

  isSubscriptionEmailAction(action: string): action is SubscriptionEmailAction {
    return (SUBSCRIPTION_EMAIL_ACTIONS as readonly string[]).includes(action);
  }

  /** Never throws — safe to fire-and-forget from subscription flows. */
  async notifyAccountAdmins(
    accountId: string,
    context: SubscriptionEmailContext,
  ): Promise<void> {
    try {
      const recipients = await this.adminEmails.resolveForAccount(accountId);
      if (recipients.length === 0) {
        this.logger.debug(
          `No admin email for subscription ${context.action} on account ${accountId}`,
        );
        return;
      }

      const planName = await this.resolvePlanName(context.planId);
      const pendingPlanName = context.pendingPlanId
        ? await this.resolvePlanName(context.pendingPlanId)
        : undefined;
      const { subject, body } = buildSubscriptionMessage(
        context,
        planName,
        pendingPlanName,
      );

      await Promise.all(
        recipients.map((to) =>
          this.email.sendSubscriptionEvent(to, subject, body),
        ),
      );

      this.platformNotifications.notifySubscriptionEvent(accountId, context);
    } catch (error) {
      this.logger.warn(
        `Subscription email failed (${context.action}) for account ${accountId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async resolvePlanName(planId: string): Promise<string> {
    const plan = await this.planModel.findOne({ planId }).select('name').exec();
    return plan?.name ?? planId;
  }
}

function buildSubscriptionMessage(
  context: SubscriptionEmailContext,
  planName: string,
  pendingPlanName?: string,
): { subject: string; body: string } {
  const cycle = formatBillingCycle(context.billingCycle);
  const periodEnd = formatEmailDate(context.periodEnd);

  switch (context.action) {
    case 'subscribed':
      return {
        subject: 'Subscription active',
        body: [
          `Your ActoCore Studio subscription is now active on the ${planName} plan${cycle}.`,
          periodEnd ? `Your current billing period ends on ${periodEnd}.` : '',
          'Manage billing anytime in Studio.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    case 'trial_started':
      return {
        subject: 'Free trial started',
        body: [
          `Your ${planName} free trial has started.`,
          periodEnd ? `Your trial ends on ${periodEnd}.` : '',
          context.details
            ? `Trial length: ${context.details} day(s).`
            : '',
          'Upgrade or manage your plan in Studio before the trial ends.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    case 'trial_ended':
      return {
        subject: 'Free trial ended',
        body: [
          `Your ${planName} free trial has ended.`,
          'Subscribe to a paid plan in Studio to keep using paid features.',
        ].join('\n\n'),
      };
    case 'cancelled':
      return {
        subject: 'Subscription cancellation scheduled',
        body: [
          `Your ${planName} subscription is scheduled to cancel${periodEnd ? ` on ${periodEnd}` : ' at the end of the current period'}.`,
          periodEnd
            ? `You keep access until ${periodEnd}.`
            : 'You keep access until the end of your current billing period.',
          context.details ? `Reason: ${context.details}` : '',
          'You can reactivate auto-renew in Studio before then if you change your mind.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    case 'reactivated':
      return {
        subject: 'Subscription reactivated',
        body: [
          `Auto-renew has been restored for your ${planName} subscription${cycle}.`,
          periodEnd ? `Your current period ends on ${periodEnd}.` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    case 'upgraded':
      return {
        subject: 'Plan upgrade scheduled',
        body: [
          pendingPlanName
            ? `Your plan will change from ${planName} to ${pendingPlanName}${cycle} at the next billing cycle.`
            : `Your plan upgrade to ${planName}${cycle} is scheduled for the next billing cycle.`,
          periodEnd ? `The change takes effect on ${periodEnd}.` : '',
          context.details ?? '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      };
    default:
      return { subject: 'Subscription update', body: 'Your subscription was updated.' };
  }
}

function formatBillingCycle(
  billingCycle?: AppSubscriptionBillingCycle,
): string {
  if (billingCycle === 'yearly') {
    return ' (yearly billing)';
  }
  if (billingCycle === 'monthly') {
    return ' (monthly billing)';
  }
  return '';
}

function formatEmailDate(value?: Date): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.toLocaleDateString('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  });
}
