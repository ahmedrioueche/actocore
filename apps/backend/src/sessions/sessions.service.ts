import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateSessionDto,
  SessionData,
  SessionMessageData,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { ChatSession, ChatSessionDocument } from './schemas/chat-session.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(ChatSession.name)
    private readonly sessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private readonly messageModel: Model<ChatMessageDocument>,
  ) {}

  async resolveSessionId(
    projectId: string,
    sessionId: string | undefined,
    body: CreateSessionDto,
  ): Promise<string> {
    if (sessionId) {
      await this.requireSession(projectId, sessionId);
      return sessionId;
    }
    const created = await this.create(projectId, body);
    return created.id;
  }

  async create(projectId: string, body: CreateSessionDto): Promise<SessionData> {
    const doc = await this.sessionModel.create({
      projectId,
      externalUserId: body.externalUserId,
      metadata: body.metadata,
    });
    return this.toSessionData(doc);
  }

  async get(projectId: string, sessionId: string): Promise<SessionData> {
    const doc = await this.requireSession(projectId, sessionId);
    return this.toSessionData(doc);
  }

  async listMessages(
    projectId: string,
    sessionId: string,
  ): Promise<SessionMessageData[]> {
    await this.requireSession(projectId, sessionId);

    const docs = await this.messageModel
      .find(
        withProjectId(projectId, {
          sessionId: new Types.ObjectId(sessionId),
        }),
      )
      .sort({ createdAt: 1 })
      .exec();

    return docs.map((doc) => this.toMessageData(doc, sessionId));
  }

  async appendMessage(
    projectId: string,
    sessionId: string,
    role: SessionMessageData['role'],
    content: string,
  ): Promise<SessionMessageData> {
    await this.requireSession(projectId, sessionId);

    const doc = await this.messageModel.create({
      projectId,
      sessionId: new Types.ObjectId(sessionId),
      role,
      content,
    });

    return this.toMessageData(doc, sessionId);
  }

  private async requireSession(
    projectId: string,
    sessionId: string,
  ): Promise<ChatSessionDocument> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const doc = await this.sessionModel
      .findOne(withProjectId(projectId, { _id: sessionId }))
      .exec();

    if (!doc) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    return doc;
  }

  private toSessionData(doc: ChatSessionDocument): SessionData {
    return {
      id: doc._id.toString(),
      externalUserId: doc.externalUserId,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
      metadata: doc.metadata,
    };
  }

  private toMessageData(
    doc: ChatMessageDocument,
    sessionId: string,
  ): SessionMessageData {
    return {
      id: doc._id.toString(),
      sessionId,
      role: doc.role,
      content: doc.content,
      createdAt: (doc.createdAt ?? new Date()).toISOString(),
    };
  }
}
