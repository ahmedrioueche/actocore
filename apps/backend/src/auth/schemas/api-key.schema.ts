import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'api_keys', timestamps: true })
export class ApiKey {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, unique: true, index: true })
  prefix!: string;

  @Prop({ required: true })
  keyHash!: string;

  @Prop()
  name?: string;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  revokedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ApiKeyDocument = HydratedDocument<ApiKey>;
export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

ApiKeySchema.index({ projectId: 1, revokedAt: 1 });
