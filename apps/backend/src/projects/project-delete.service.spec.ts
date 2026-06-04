import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiKey } from '../auth/schemas/api-key.schema';
import { ProjectAction } from '../actions/schemas/project-action.schema';
import { KnowledgeChunk } from '../knowledge/schemas/knowledge-chunk.schema';
import { KnowledgeSource } from '../knowledge/schemas/knowledge-source.schema';
import { KnowledgeStorageService } from '../knowledge/knowledge-storage.service';
import { ChatMessage } from '../sessions/schemas/chat-message.schema';
import { ChatSession } from '../sessions/schemas/chat-session.schema';
import { UsageEvent } from '../usage/schemas/usage-event.schema';
import { StudioMembership } from '../studio/schemas/studio-membership.schema';
import { Project } from './schemas/project.schema';
import { ProjectDeleteService } from './project-delete.service';

describe('ProjectDeleteService', () => {
  let service: ProjectDeleteService;
  const deleteMany = jest.fn().mockResolvedValue({});
  const findByIdAndDelete = jest.fn().mockResolvedValue({});
  const updateMany = jest.fn().mockResolvedValue({});

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectDeleteService,
        {
          provide: getModelToken(Project.name),
          useValue: {
            find: jest.fn(() => ({
              exec: async () => [],
            })),
            findByIdAndDelete,
          },
        },
        {
          provide: getModelToken(ApiKey.name),
          useValue: { deleteMany },
        },
        {
          provide: getModelToken(ProjectAction.name),
          useValue: { deleteMany },
        },
        {
          provide: getModelToken(KnowledgeSource.name),
          useValue: {
            find: jest.fn(() => ({ exec: async () => [] })),
            deleteMany,
          },
        },
        {
          provide: getModelToken(KnowledgeChunk.name),
          useValue: { deleteMany },
        },
        {
          provide: getModelToken(ChatSession.name),
          useValue: { deleteMany },
        },
        {
          provide: getModelToken(ChatMessage.name),
          useValue: { deleteMany },
        },
        {
          provide: getModelToken(UsageEvent.name),
          useValue: { deleteMany },
        },
        {
          provide: getModelToken(StudioMembership.name),
          useValue: { updateMany },
        },
        {
          provide: KnowledgeStorageService,
          useValue: { remove: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ProjectDeleteService);
  });

  it('deletes project-scoped data and membership project refs', async () => {
    const projectId = '507f1f77bcf86cd799439011';
    const accountId = '507f1f77bcf86cd799439012';

    await service.deleteProject(projectId, accountId);

    expect(deleteMany).toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: expect.anything() }),
      { $pull: { projectIds: projectId } },
    );
    expect(findByIdAndDelete).toHaveBeenCalledWith(projectId);
  });
});
