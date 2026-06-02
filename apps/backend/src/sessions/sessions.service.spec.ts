import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ChatMessage } from './schemas/chat-message.schema';
import { ChatSession } from './schemas/chat-session.schema';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let service: SessionsService;
  const projectId = new Types.ObjectId().toString();

  const sessions = new Map<string, Record<string, unknown>>();
  const messages: Array<Record<string, unknown>> = [];

  const sessionModel = {
    create: jest.fn(async (data: Record<string, unknown>) => {
      const id = new Types.ObjectId();
      const doc = {
        _id: id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sessions.set(id.toString(), doc);
      return doc;
    }),
    findOne: jest.fn((filter: { _id?: string; projectId: string }) => ({
      exec: async () => {
        const id = filter._id?.toString();
        if (!id) {
          return null;
        }
        const doc = sessions.get(id);
        if (!doc || doc.projectId !== filter.projectId) {
          return null;
        }
        return doc;
      },
    })),
  };

  const messageModel = {
    create: jest.fn(async (data: Record<string, unknown>) => {
      const doc = {
        _id: new Types.ObjectId(),
        ...data,
        createdAt: new Date(),
      };
      messages.push(doc);
      return doc;
    }),
    find: jest.fn(() => ({
      sort: () => ({
        exec: async () =>
          messages.filter(
            (m) =>
              m.projectId === projectId &&
              (m.sessionId as Types.ObjectId).toString() ===
                messages[messages.length - 1]?.sessionId?.toString(),
          ),
      }),
    })),
  };

  beforeEach(async () => {
    sessions.clear();
    messages.length = 0;
    jest.clearAllMocks();

    messageModel.find.mockImplementation((filter: { sessionId: Types.ObjectId }) => ({
      sort: () => ({
        exec: async () =>
          messages
            .filter(
              (m) =>
                m.projectId === projectId &&
                (m.sessionId as Types.ObjectId).equals(filter.sessionId),
            )
            .sort(
              (a, b) =>
                (a.createdAt as Date).getTime() - (b.createdAt as Date).getTime(),
            ),
      }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getModelToken(ChatSession.name), useValue: sessionModel },
        { provide: getModelToken(ChatMessage.name), useValue: messageModel },
      ],
    }).compile();

    service = module.get(SessionsService);
  });

  it('creates and resolves a session', async () => {
    const created = await service.create(projectId, { externalUserId: 'u1' });
    const id = await service.resolveSessionId(projectId, created.id, {});
    expect(id).toBe(created.id);
  });

  it('rejects invalid session ids', async () => {
    await expect(
      service.resolveSessionId(projectId, 'not-an-object-id', {}),
    ).rejects.toThrow(NotFoundException);
  });

  it('appends and lists messages in order', async () => {
    const session = await service.create(projectId, {});
    await service.appendMessage(projectId, session.id, 'user', 'Hello');
    await service.appendMessage(projectId, session.id, 'assistant', 'Hi');

    const listed = await service.listMessages(projectId, session.id);
    expect(listed).toHaveLength(2);
    expect(listed[0].content).toBe('Hello');
    expect(listed[1].role).toBe('assistant');
  });
});
