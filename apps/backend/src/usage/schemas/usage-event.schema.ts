import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'usage_events', timestamps: { createdAt: true, updatedAt: false } })
export class UsageEvent {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  route!: string;

  @Prop()
  intent?: string;

  @Prop()
  llmModel?: string;

  @Prop()
  promptTokens?: number;

  @Prop()
  completionTokens?: number;

  @Prop()
  apiKeyId?: string;

  @Prop()
  latencyMs?: number;

  @Prop({ default: true })
  success!: boolean;

  @Prop()
  errorCode?: string;

  createdAt?: Date;
}

export type UsageEventDocument = HydratedDocument<UsageEvent>;
export const UsageEventSchema = SchemaFactory.createForClass(UsageEvent);

UsageEventSchema.index({ projectId: 1, createdAt: -1 });
