import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'knowledge_sources', timestamps: true })
export class KnowledgeSource {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, type: String, enum: ['text', 'url', 'document', 'sitemap'] })
  type!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  url?: string;

  /** Stored body for text sources so re-index can run without resubmitting content. */
  @Prop()
  textContent?: string;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'indexing', 'ready', 'error'],
    default: 'pending',
  })
  status!: string;

  @Prop({ default: 0 })
  chunkCount!: number;

  @Prop()
  errorMessage?: string;

  @Prop()
  originalFilename?: string;

  @Prop()
  mimeType?: string;

  @Prop()
  byteSize?: number;

  @Prop()
  storageKey?: string;

  /** App Layout page ids this source applies to; empty = all pages. */
  @Prop({ type: [String], default: [] })
  pageIds!: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export type KnowledgeSourceDocument = HydratedDocument<KnowledgeSource>;
export const KnowledgeSourceSchema =
  SchemaFactory.createForClass(KnowledgeSource);

KnowledgeSourceSchema.index({ projectId: 1, createdAt: -1 });
KnowledgeSourceSchema.index({ projectId: 1, pageIds: 1 });
