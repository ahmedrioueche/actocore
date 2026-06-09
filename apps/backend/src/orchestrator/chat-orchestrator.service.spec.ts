import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ActionRunnerService } from '../actions/action-runner.service';
import { ActionSelectorService } from '../actions/action-selector.service';
import { ActionsService } from '../actions/actions.service';
import {
  QA_NO_CITATIONS_REPLY,
  QaRunnerService,
} from '../knowledge/qa-runner.service';
import { AiDecisionLogger } from '../observability/ai-decision.logger';
import { ChatResponseFormatter } from '../response/chat-response.formatter';
import { UsageService } from '../usage/usage.service';
import { LLM_PROVIDER } from '../external/llm/llm-provider.interface';
import { SessionsService } from '../sessions/sessions.service';
import { SdkConfigService } from '../projects/sdk-config/sdk-config.service';
import { ChatOrchestratorService } from './chat-orchestrator.service';
import { INTENT_CLASSIFIER } from './intent-classifier.interface';

describe('ChatOrchestratorService', () => {
  const context = {
    projectId: '507f1f77bcf86cd799439011',
    projectName: 'Test',
    settings: { systemPrompt: 'You are helpful.' },
    apiKeyId: 'key-1',
  };

  const sessionsMock = {
    resolveSessionId: jest.fn(),
    appendMessage: jest.fn(),
    listMessages: jest.fn(),
  };

  const llmMock = { complete: jest.fn() };
  const classifierMock = { classify: jest.fn().mockResolvedValue('direct') };
  const actionsMock = {
    listEnabled: jest.fn().mockResolvedValue([]),
    sectionNameMap: jest.fn().mockResolvedValue(new Map<string, string>()),
  };
  const selectorMock = { select: jest.fn() };
  const runnerMock = {
    formatNoActionsMessage: jest
      .fn()
      .mockReturnValue('No actions configured'),
    formatNoMatchMessage: jest.fn().mockReturnValue('No match'),
    prepareExecution: jest.fn(),
  };
  const qaRunnerMock = {
    buildPromptContext: jest.fn().mockResolvedValue({
      modeNote: 'QA context',
      citations: [],
    }),
  };
  const usageMock = { recordChatUsage: jest.fn().mockResolvedValue(undefined) };
  const aiLoggerMock = { log: jest.fn(), logActionFailure: jest.fn() };
  const sdkConfigMock = {
    getConfig: jest.fn().mockResolvedValue({ sdkConfigVersion: 0 }),
    filterEnabledActions: jest.fn(
      (_projectId: string, actions: unknown[]) => actions,
    ),
  };
  const configServiceMock = {
    getOrThrow: jest.fn().mockReturnValue({ provider: 'stub' }),
  };

  let orchestrator: ChatOrchestratorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    classifierMock.classify.mockResolvedValue('direct');

    sessionsMock.resolveSessionId.mockResolvedValue('507f1f77bcf86cd799439012');
    sessionsMock.appendMessage.mockResolvedValue({
      id: 'm1',
      sessionId: '507f1f77bcf86cd799439012',
      role: 'assistant',
      content: 'LLM reply',
      createdAt: new Date().toISOString(),
    });
    sessionsMock.listMessages.mockResolvedValue([]);
    llmMock.complete.mockResolvedValue({
      content: 'LLM reply',
      model: 'stub',
      promptTokens: 3,
      completionTokens: 2,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatOrchestratorService,
        ChatResponseFormatter,
        { provide: SessionsService, useValue: sessionsMock },
        { provide: ActionsService, useValue: actionsMock },
        { provide: ActionSelectorService, useValue: selectorMock },
        { provide: ActionRunnerService, useValue: runnerMock },
        { provide: QaRunnerService, useValue: qaRunnerMock },
        { provide: UsageService, useValue: usageMock },
        { provide: AiDecisionLogger, useValue: aiLoggerMock },
        { provide: LLM_PROVIDER, useValue: llmMock },
        { provide: INTENT_CLASSIFIER, useValue: classifierMock },
        { provide: SdkConfigService, useValue: sdkConfigMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    orchestrator = module.get(ChatOrchestratorService);
  });

  it('records usage and logs AI decisions', async () => {
    await orchestrator.sendMessage(context, { message: 'Hello' });

    expect(usageMock.recordChatUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: context.projectId,
        intent: 'direct',
        apiKeyId: context.apiKeyId,
        llmProvider: 'stub',
      }),
    );
    expect(aiLoggerMock.log).toHaveBeenCalled();
  });

  it('refuses QA questions when RAG returns no citations without calling the LLM', async () => {
    classifierMock.classify.mockResolvedValue('qa');
    qaRunnerMock.buildPromptContext.mockResolvedValue({
      modeNote: 'No docs matched',
      citations: [],
    });
    sessionsMock.appendMessage.mockResolvedValue({
      id: 'm2',
      sessionId: '507f1f77bcf86cd799439012',
      role: 'assistant',
      content: QA_NO_CITATIONS_REPLY,
      createdAt: new Date().toISOString(),
    });

    const response = await orchestrator.sendMessage(context, {
      message: 'What is this app about?',
    });

    expect(llmMock.complete).not.toHaveBeenCalled();
    expect(response.content).toBe(QA_NO_CITATIONS_REPLY);
    expect(response.intent).toBe('qa');
    expect(response.sources).toBeUndefined();
  });
});
