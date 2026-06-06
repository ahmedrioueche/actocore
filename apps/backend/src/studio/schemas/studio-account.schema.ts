import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class StudioAccountPreferencesSchema {
  @Prop({ default: true })
  quotaAlertEmails!: boolean;

  @Prop({ default: true })
  billingEmails!: boolean;

  @Prop({ default: false })
  productEmails!: boolean;

  @Prop({ trim: true })
  quotaWebhookUrl?: string;
}

@Schema({ _id: false })
export class StudioOnboardingSchema {
  @Prop({ default: false })
  completed!: boolean;

  @Prop({ default: false })
  skipped!: boolean;

  @Prop()
  completedAt?: Date;

  @Prop({ type: [String], default: [] })
  completedSteps!: string[];

  @Prop({ default: 'welcome' })
  currentStep!: string;
}

@Schema({ _id: false })
class QuotaAlertStateSchema {
  @Prop({ required: true })
  monthKey!: string;

  @Prop({ default: false })
  warned80?: boolean;

  @Prop({ default: false })
  warned90?: boolean;

  @Prop({ default: false })
  warned100?: boolean;
}

@Schema({ collection: 'studio_accounts', timestamps: true })
export class StudioAccount {
  @Prop({ required: true })
  name!: string;

  @Prop({ lowercase: true, trim: true })
  billingEmail?: string;

  @Prop({ trim: true })
  timezone?: string;

  @Prop({ trim: true })
  defaultLocale?: string;

  @Prop({
    type: StudioAccountPreferencesSchema,
    default: () => ({
      quotaAlertEmails: true,
      billingEmails: true,
      productEmails: false,
    }),
  })
  preferences!: StudioAccountPreferencesSchema;

  @Prop({
    type: StudioOnboardingSchema,
    default: () => ({
      completed: false,
      skipped: false,
      completedSteps: [],
      currentStep: 'welcome',
    }),
  })
  onboarding!: StudioOnboardingSchema;

  @Prop()
  paddleCustomerId?: string;

  @Prop({ type: QuotaAlertStateSchema })
  quotaAlerts?: QuotaAlertStateSchema;

  createdAt?: Date;
  updatedAt?: Date;
}

export type StudioAccountDocument = HydratedDocument<StudioAccount>;
export const StudioAccountSchema = SchemaFactory.createForClass(StudioAccount);
