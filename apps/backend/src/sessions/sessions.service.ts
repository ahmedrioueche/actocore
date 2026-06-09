import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type {
  CreateSessionDto,
  ListSessionMessagesQuery,
  Paginated,
  PaginationQuery,
  SessionData,
  SessionMessageData,
  SessionMessagesPageData,
} from '@ahmedrioueche/actocore-shared';
import { Model, Types } from 'mongoose';
import { withProjectId } from '../common/tenant/tenant-scope';
import { normalizePagination, paginate } from '../common/pagination/pagination.util';
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

  async listForProject(
    projectId: string,
    options: { limit?: number; externalUserId?: string } = {},
  ): Promise<SessionData[]> {
    const filter: Record<string, unknown> = {};
    const externalUserId = options.externalUserId?.trim();
    if (externalUserId) {
      filter.externalUserId = externalUserId;
    }

    const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const docs = await this.sessionModel
      .find(withProjectId(projectId, filter))
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => this.toSessionData(doc));
  }

  /** Paginated variant used by the Studio sessions list route. */
  async listForProjectPaginated(
    projectId: string,
    options: { externalUserId?: string } & PaginationQuery = {},
  ): Promise<Paginated<SessionData>> {
    const { page, limit, skip } = normalizePagination(options);
    const filter: Record<string, unknown> = {};
    const externalUserId = options.externalUserId?.trim();
    if (externalUserId) {
      filter.externalUserId = externalUserId;
    }

    const scoped = withProjectId(projectId, filter);
    const [docs, total] = await Promise.all([
      this.sessionModel
        .find(scoped)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sessionModel.countDocuments(scoped).exec(),
    ]);

    return paginate(
      docs.map((doc) => this.toSessionData(doc)),
      total,
      { page, limit },
    );
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

  async listMessagesPage(
    projectId: string,
    sessionId: string,
    query: ListSessionMessagesQuery = {},
  ): Promise<SessionMessagesPageData> {
    await this.requireSession(projectId, sessionId);

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const sessionObjectId = new Types.ObjectId(sessionId);
    const filter: Record<string, unknown> = {
      sessionId: sessionObjectId,
    };

    if (query.before) {
      const cursor = await this.messageModel
        .findOne(
          withProjectId(projectId, {
            _id: query.before,
            sessionId: sessionObjectId,
          }),
        )
        .exec();

      if (!cursor) {
        throw new NotFoundException(`Message ${query.before} not found`);
      }

      const createdAt = cursor.createdAt ?? new Date(0);
      filter.$or = [
        { createdAt: { $lt: createdAt } },
        {
          createdAt,
          _id: { $lt: cursor._id },
        },
      ];
    }

    const docs = await this.messageModel
      .find(withProjectId(projectId, filter))
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    return {
      items: pageDocs
        .slice()
        .reverse()
        .map((doc) => this.toMessageData(doc, sessionId)),
      hasMore,
    };
  }

  async deleteSession(projectId: string, sessionId: string): Promise<void> {
    await this.requireSession(projectId, sessionId);
    const sessionObjectId = new Types.ObjectId(sessionId);

    await this.messageModel
      .deleteMany(
        withProjectId(projectId, {
          sessionId: sessionObjectId,
        }),
      )
      .exec();

    await this.sessionModel
      .deleteOne(withProjectId(projectId, { _id: sessionId }))
      .exec();
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
