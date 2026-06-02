import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  collection: 'chat_messages',
  timestamps: { createdAt: true, updatedAt: false },
})
export class ChatMessage {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  sessionId!: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role!: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content!: string;

  createdAt?: Date;
}

export type ChatMessageDocument = HydratedDocument<ChatMessage>;
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

ChatMessageSchema.index({ projectId: 1, sessionId: 1, createdAt: 1 });
