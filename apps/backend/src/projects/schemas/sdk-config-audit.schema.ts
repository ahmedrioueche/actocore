import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'sdk_config_audit', timestamps: true })
export class SdkConfigAudit {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  sdkConfigVersion!: number;

  @Prop({ type: [String], default: [] })
  changedSections!: string[];

  @Prop()
  actor?: string;

  createdAt?: Date;
}

export type SdkConfigAuditDocument = HydratedDocument<SdkConfigAudit>;
export const SdkConfigAuditSchema = SchemaFactory.createForClass(SdkConfigAudit);

SdkConfigAuditSchema.index({ projectId: 1, createdAt: -1 });
