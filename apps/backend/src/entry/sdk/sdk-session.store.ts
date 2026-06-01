import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateSessionDto,
  SessionData,
  SessionMessageData,
} from '@ahmedrioueche/actocore-shared';
interface StoredSession extends SessionData {
  projectId: string;
  messages: SessionMessageData[];
}

@Injectable()
export class SdkSessionStore {
  private readonly sessions = new Map<string, StoredSession>();

  create(projectId: string, body: CreateSessionDto): SessionData {
    const session: StoredSession = {
      id: randomUUID(),
      projectId,
      externalUserId: body.externalUserId,
      createdAt: new Date().toISOString(),
      metadata: body.metadata,
      messages: [],
    };
    this.sessions.set(session.id, session);
    return this.toSessionData(session);
  }

  get(projectId: string, sessionId: string): SessionData {
    return this.toSessionData(this.require(projectId, sessionId));
  }

  listMessages(
    projectId: string,
    sessionId: string,
  ): SessionMessageData[] {
    return [...this.require(projectId, sessionId).messages];
  }

  appendMessage(
    projectId: string,
    sessionId: string,
    role: SessionMessageData['role'],
    content: string,
  ): SessionMessageData {
    const session = this.require(projectId, sessionId);
    const message: SessionMessageData = {
      id: randomUUID(),
      sessionId,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(message);
    return message;
  }

  private require(projectId: string, sessionId: string): StoredSession {
    const session = this.sessions.get(sessionId);
    if (!session || session.projectId !== projectId) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  private toSessionData(session: StoredSession): SessionData {
    return {
      id: session.id,
      externalUserId: session.externalUserId,
      createdAt: session.createdAt,
      metadata: session.metadata,
    };
  }
}
