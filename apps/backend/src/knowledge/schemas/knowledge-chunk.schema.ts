import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class KnowledgeChunkMetadata {
  @Prop({ type: [String] })
  headingPath?: string[];

  @Prop({ enum: ['text', 'url', 'document', 'sitemap'] })
  sourceType?: 'text' | 'url' | 'document' | 'sitemap';

  /** 1-based page number for PDF-derived chunks. */
  @Prop({ type: Number, min: 1 })
  page?: number;

  /** Source page URL for sitemap-derived chunks. */
  @Prop()
  pageUrl?: string;

  @Prop({ type: [String] })
  pageIds?: string[];
}

const KnowledgeChunkMetadataSchema =
  SchemaFactory.createForClass(KnowledgeChunkMetadata);

@Schema({ collection: 'knowledge_chunks', timestamps: { createdAt: true, updatedAt: false } })
export class KnowledgeChunk {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  sourceId!: Types.ObjectId;

  @Prop({ required: true })
  sourceTitle!: string;

  @Prop({ required: true })
  chunkIndex!: number;

  @Prop({ required: true, enum: ['parent', 'child'], default: 'child' })
  kind!: 'parent' | 'child';

  @Prop({ type: Types.ObjectId, index: true })
  parentChunkId?: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: KnowledgeChunkMetadataSchema })
  metadata?: KnowledgeChunkMetadata;

  /** Present on child chunks used for vector search. */
  @Prop({ type: [Number] })
  embedding?: number[];

  createdAt?: Date;
}

export type KnowledgeChunkDocument = HydratedDocument<KnowledgeChunk>;
export const KnowledgeChunkSchema = SchemaFactory.createForClass(KnowledgeChunk);

KnowledgeChunkSchema.index({ projectId: 1, sourceId: 1, chunkIndex: 1 });
KnowledgeChunkSchema.index({ projectId: 1, kind: 1 });
KnowledgeChunkSchema.index({ projectId: 1, content: 'text' });
KnowledgeChunkSchema.index({ projectId: 1, 'metadata.pageIds': 1 });
