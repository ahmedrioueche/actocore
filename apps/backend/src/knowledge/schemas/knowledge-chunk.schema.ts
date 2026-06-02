import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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

  @Prop({ required: true })
  content!: string;

  @Prop({ type: [Number], required: true })
  embedding!: number[];

  createdAt?: Date;
}

export type KnowledgeChunkDocument = HydratedDocument<KnowledgeChunk>;
export const KnowledgeChunkSchema = SchemaFactory.createForClass(KnowledgeChunk);

KnowledgeChunkSchema.index({ projectId: 1, sourceId: 1, chunkIndex: 1 });
