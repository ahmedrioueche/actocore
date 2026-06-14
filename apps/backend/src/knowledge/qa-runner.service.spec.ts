import { Test } from '@nestjs/testing';
import type { RagRetrievalLog } from './rag-retrieval.types';
import { QaRunnerService } from './qa-runner.service';
import { RagQueryRewriteService } from './rag-query-rewrite.service';
import { RagRetrievalService } from './rag-retrieval.service';

describe('QaRunnerService', () => {
  const retrievalMock = {
    retrieve: jest.fn(),
  };

  const queryRewriteMock = {
    rewrite: jest.fn(),
  };

  let service: QaRunnerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    queryRewriteMock.rewrite.mockResolvedValue({
      searchQuery: 'What is ActoCore?',
      rewritten: false,
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        QaRunnerService,
        { provide: RagRetrievalService, useValue: retrievalMock },
        { provide: RagQueryRewriteService, useValue: queryRewriteMock },
      ],
    }).compile();

    service = moduleRef.get(QaRunnerService);
  });

  it('returns citation instructions and retrieval log when docs match', async () => {
    const retrievalLog: RagRetrievalLog = {
      candidateCount: 2,
      contextPartCount: 1,
      topScore: 0.91,
      chunks: [
        {
          chunkId: 'chunk-1',
          sourceId: 'source-1',
          score: 0.91,
        },
      ],
    };

    retrievalMock.retrieve.mockResolvedValue({
      contextBlock: '[1] Docs\nActoCore helps apps integrate AI.',
      citations: [
        {
          sourceId: 'source-1',
          sourceTitle: 'Docs',
          chunkIndex: 0,
          excerpt: 'ActoCore helps apps integrate AI.',
          score: 0.91,
        },
      ],
      rankedHits: [
        {
          chunkId: 'chunk-1',
          sourceId: 'source-1',
          score: 0.91,
          content: 'ActoCore helps apps integrate AI.',
        },
      ],
      retrievalLog,
    });

    const result = await service.buildPromptContext(
      'project-1',
      'What is ActoCore?',
      { sessionId: 'session-1' },
    );

    expect(queryRewriteMock.rewrite).toHaveBeenCalledWith('What is ActoCore?', {
      sessionId: 'session-1',
    });
    expect(retrievalMock.retrieve).toHaveBeenCalledWith(
      'project-1',
      'What is ActoCore?',
      undefined,
      undefined,
    );
    expect(result.citations).toHaveLength(1);
    expect(result.retrievalLog).toEqual({
      ...retrievalLog,
      originalQuery: 'What is ActoCore?',
      searchQuery: 'What is ActoCore?',
      queryRewritten: false,
    });
    expect(result.modeNote).toContain('cite inline using [1], [2]');
    expect(result.modeNote).toContain('--- Retrieved knowledge ---');
    expect(result.modeNote).toContain('ActoCore helps apps integrate AI.');
  });

  it('retrieves using rewritten search query', async () => {
    queryRewriteMock.rewrite.mockResolvedValue({
      searchQuery: 'team invite editor seat',
      rewritten: true,
    });

    retrievalMock.retrieve.mockResolvedValue({
      contextBlock: '',
      citations: [],
      rankedHits: [],
      emptyReason: 'no_candidates',
      retrievalLog: {
        candidateCount: 0,
        contextPartCount: 0,
        chunks: [],
      },
    });

    await service.buildPromptContext(
      'project-1',
      'How do I add someone to my team?',
    );

    expect(retrievalMock.retrieve).toHaveBeenCalledWith(
      'project-1',
      'team invite editor seat',
      undefined,
      undefined,
    );
  });

  it('passes current page id for page-aware retrieval boost', async () => {
    queryRewriteMock.rewrite.mockResolvedValue({
      searchQuery: 'How do refunds work?',
      rewritten: false,
    });

    retrievalMock.retrieve.mockResolvedValue({
      contextBlock: '[1] Billing\nRefund policy details.',
      citations: [],
      rankedHits: [],
      retrievalLog: {
        candidateCount: 1,
        contextPartCount: 1,
        chunks: [],
      },
    });

    await service.buildPromptContext('project-1', 'How do refunds work?', {
      currentPageId: 'page-billing',
      currentPageTitle: 'Billing',
    });

    expect(retrievalMock.retrieve).toHaveBeenCalledWith(
      'project-1',
      'How do refunds work?',
      undefined,
      { currentPageId: 'page-billing' },
    );
  });

  it('returns empty citations and retrieval log when retrieval is empty', async () => {
    queryRewriteMock.rewrite.mockResolvedValue({
      searchQuery: 'Unknown topic',
      rewritten: false,
    });

    const retrievalLog: RagRetrievalLog = {
      candidateCount: 0,
      contextPartCount: 0,
      emptyReason: 'no_candidates',
      chunks: [],
    };

    retrievalMock.retrieve.mockResolvedValue({
      contextBlock: '',
      citations: [],
      rankedHits: [],
      emptyReason: 'no_candidates',
      retrievalLog,
    });

    const result = await service.buildPromptContext(
      'project-1',
      'Unknown topic',
    );

    expect(result.citations).toHaveLength(0);
    expect(result.retrievalLog).toEqual({
      ...retrievalLog,
      originalQuery: 'Unknown topic',
      searchQuery: 'Unknown topic',
      queryRewritten: false,
    });
    expect(result.modeNote).toContain('No project documentation matched');
  });
});
