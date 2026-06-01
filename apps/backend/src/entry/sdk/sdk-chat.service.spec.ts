import { Test, TestingModule } from '@nestjs/testing';
import { LLM_PROVIDER } from '../../external/llm/llm-provider.interface';
import { SdkChatService } from './sdk-chat.service';
import { SdkSessionStore } from './sdk-session.store';

describe('SdkChatService', () => {
  let service: SdkChatService;

  const context = {
    projectId: 'proj-1',
    projectName: 'Test',
    settings: {
      systemPrompt: 'You are helpful.',
      rules: ['Be concise'],
      tone: 'friendly',
    },
    apiKeyId: 'key-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdkChatService,
        SdkSessionStore,
        {
          provide: LLM_PROVIDER,
          useValue: {
            complete: jest.fn().mockImplementation((messages) => {
              expect(messages[0]).toEqual({
                role: 'system',
                content: 'You are helpful.',
              });
              return Promise.resolve({
                content: 'Hello from stub',
                model: 'stub',
              });
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SdkChatService>(SdkChatService);
  });

  it('injects project settings into the LLM prompt', async () => {
    const result = await service.sendMessage(context, { message: 'Hi' });

    expect(result.content).toBe('Hello from stub');
    expect(result.sessionId).toBeDefined();
  });
});
