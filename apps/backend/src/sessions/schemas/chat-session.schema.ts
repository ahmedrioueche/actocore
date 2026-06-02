import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'chat_sessions', timestamps: true })
export class ChatSession {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop()
  externalUserId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatSessionDocument = HydratedDocument<ChatSession>;
export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

ChatSessionSchema.index({ projectId: 1, createdAt: -1 });
