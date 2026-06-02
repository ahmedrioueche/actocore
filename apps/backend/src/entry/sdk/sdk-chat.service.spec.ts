import { Test, TestingModule } from '@nestjs/testing';
import { ChatOrchestratorService } from '../../orchestrator/chat-orchestrator.service';
import { SdkChatService } from './sdk-chat.service';

describe('SdkChatService', () => {
  it('delegates to the orchestrator', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SdkChatService,
        {
          provide: ChatOrchestratorService,
          useValue: {
            sendMessage: jest.fn().mockResolvedValue({
              sessionId: 's1',
              messageId: 'm1',
              role: 'assistant',
              content: 'Hi',
              intent: 'direct',
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(SdkChatService);
    const orchestrator = module.get(ChatOrchestratorService);
    const context = {
      projectId: 'p1',
      projectName: 'T',
      settings: {},
      apiKeyId: 'k1',
    };

    const result = await service.sendMessage(context, { message: 'Hello' });

    expect(orchestrator.sendMessage).toHaveBeenCalledWith(context, {
      message: 'Hello',
    });
    expect(result.content).toBe('Hi');
  });
});
