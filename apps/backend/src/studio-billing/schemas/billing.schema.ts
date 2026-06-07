import {
  APP_PAYMENT_PROVIDERS,
  APP_PLAN_LEVELS,
  APP_SUBSCRIPTION_BILLING_CYCLES,
  APP_SUBSCRIPTION_HISTORY_ACTIONS,
  APP_SUBSCRIPTION_STATUSES,
} from '@ahmedrioueche/actocore-shared';
import type {
  AppPaymentProvider,
  AppPlanLevel,
  AppSubscriptionBillingCycle,
  AppSubscriptionStatus,
} from '@ahmedrioueche/actocore-shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
class StudioPlanLimitsSchema {
  @Prop({ min: 0 })
  maxProjects?: number;

  @Prop({ min: 0 })
  maxTeamSeats?: number;

  @Prop({ min: 0 })
  monthlyChatQuota?: number;
}

@Schema({ collection: 'studio_plans', timestamps: true })
export class StudioPlanModel extends Document {
  @Prop({ required: true, unique: true })
  planId!: string;

  @Prop({ default: 1 })
  version?: number;

  @Prop({ default: 0 })
  order?: number;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ type: String, required: true, enum: APP_PLAN_LEVELS })
  level!: AppPlanLevel;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  pricing!: Record<string, { monthly?: number; yearly?: number }>;

  @Prop()
  paddleProductId?: string;

  @Prop({ type: Object })
  paddlePriceIds?: { monthly?: string; yearly?: string };

  @Prop({ type: StudioPlanLimitsSchema, required: true })
  limits!: StudioPlanLimitsSchema;

  @Prop({ default: 14 })
  trialDays?: number;

  @Prop({ type: [String], default: [] })
  features?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const StudioPlanSchema = SchemaFactory.createForClass(StudioPlanModel);
StudioPlanSchema.index({ level: 1, isActive: 1 });

@Schema({ collection: 'studio_paddle_webhook_events', timestamps: false })
export class StudioPaddleWebhookEventModel extends Document {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  eventType!: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  processedAt!: Date;
}

export const StudioPaddleWebhookEventSchema = SchemaFactory.createForClass(
  StudioPaddleWebhookEventModel,
);

@Schema({ _id: false })
class TrialInfoSchema {
  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ default: true })
  hasUsedTrial!: boolean;

  @Prop()
  convertedToPaid?: boolean;
}

@Schema({ collection: 'studio_subscriptions', timestamps: true })
export class StudioSubscriptionModel extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'StudioAccount', index: true })
  accountId!: Types.ObjectId;

  @Prop({ required: true })
  planId!: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Date, required: true })
  currentPeriodStart!: Date;

  @Prop({ type: Date, required: true })
  currentPeriodEnd!: Date;

  @Prop({ type: String, required: true, enum: APP_SUBSCRIPTION_STATUSES })
  status!: AppSubscriptionStatus;

  @Prop({ default: true })
  autoRenew?: boolean;

  @Prop({ type: String, enum: APP_SUBSCRIPTION_BILLING_CYCLES })
  billingCycle?: AppSubscriptionBillingCycle;

  @Prop({ type: Date })
  lastPaymentDate?: Date;

  @Prop({ type: Date })
  nextPaymentDate?: Date;

  @Prop({ type: TrialInfoSchema })
  trial?: TrialInfoSchema;

  @Prop()
  cancelledAt?: string;

  @Prop()
  cancelAtPeriodEnd?: boolean;

  @Prop()
  cancellationReason?: string;

  @Prop()
  pendingPlanId?: string;

  @Prop({ type: String, enum: APP_SUBSCRIPTION_BILLING_CYCLES })
  pendingBillingCycle?: AppSubscriptionBillingCycle;

  @Prop({ type: Date })
  pendingChangeEffectiveDate?: Date;

  @Prop({ type: String, required: true, enum: APP_PAYMENT_PROVIDERS })
  provider!: AppPaymentProvider;

  @Prop({ unique: true, sparse: true })
  paddleSubscriptionId?: string;

  @Prop()
  paddleCustomerId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StudioSubscriptionSchema = SchemaFactory.createForClass(
  StudioSubscriptionModel,
);
StudioSubscriptionSchema.index({ accountId: 1, status: 1 });

@Schema({ collection: 'studio_subscription_history', timestamps: true })
export class StudioSubscriptionHistoryModel extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'StudioAccount' })
  accountId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'StudioSubscription' })
  subscriptionId!: Types.ObjectId;

  @Prop({ required: true })
  planId!: string;

  @Prop({ type: String, required: true, enum: APP_SUBSCRIPTION_HISTORY_ACTIONS })
  action!: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: String, required: true, enum: APP_SUBSCRIPTION_STATUSES })
  status!: AppSubscriptionStatus;

  @Prop()
  details?: string;

  @Prop({ min: 0 })
  amountPaid?: number;

  @Prop({ type: String })
  currency?: string;

  @Prop({ unique: true, sparse: true })
  providerTransactionId?: string;

  createdAt?: Date;
}

export const StudioSubscriptionHistorySchema = SchemaFactory.createForClass(
  StudioSubscriptionHistoryModel,
);
