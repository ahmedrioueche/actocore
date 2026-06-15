import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'playground_sessions', timestamps: true })
export class PlaygroundSession {
  @Prop({ required: true, unique: true, index: true })
  visitorId!: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true })
  projectName!: string;

  @Prop({ required: true })
  apiKeyId!: string;

  /** AES-256-GCM encrypted SDK key — returned again on idempotent bootstrap. */
  @Prop({ required: true })
  apiKeyCiphertext!: string;

  @Prop()
  origin?: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type PlaygroundSessionDocument = HydratedDocument<PlaygroundSession>;
export const PlaygroundSessionSchema =
  SchemaFactory.createForClass(PlaygroundSession);
