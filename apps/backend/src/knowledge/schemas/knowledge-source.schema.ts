import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'knowledge_sources', timestamps: true })
export class KnowledgeSource {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, type: String, enum: ['text', 'url', 'document'] })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  url?: string;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'ready', 'error'],
    default: 'pending',
  })
  status!: string;

  @Prop({ default: 0 })
  chunkCount!: number;

  @Prop()
  errorMessage?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type KnowledgeSourceDocument = HydratedDocument<KnowledgeSource>;
export const KnowledgeSourceSchema =
  SchemaFactory.createForClass(KnowledgeSource);

KnowledgeSourceSchema.index({ projectId: 1, createdAt: -1 });
