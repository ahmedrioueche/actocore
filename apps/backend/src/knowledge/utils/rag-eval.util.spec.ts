import type { RagRankedHit } from '../rag-retrieval.types';
import {
  assertEvalReportMeetsThresholds,
  evaluateCase,
  evalReportMeetsThresholds,
  keywordRecall,
  meanReciprocalRank,
  parseRagEvalFixture,
  recallAtK,
  summarizeEvalReport,
} from './rag-eval.util';

describe('rag-eval.util', () => {
  const hits: RagRankedHit[] = [
    {
      chunkId: 'c1',
      sourceId: 'source-a',
      score: 0.9,
      content: 'ActoCore is an AI integration layer.',
    },
    {
      chunkId: 'c2',
      sourceId: 'source-b',
      score: 0.7,
      content: 'Use error code ERR-404 for missing workspaces.',
    },
    {
      chunkId: 'c3',
      sourceId: 'source-c',
      score: 0.4,
      content: 'Unrelated cooking recipes.',
    },
  ];

  it('computes recall@k', () => {
    expect(recallAtK(hits, ['source-a'], 1)).toBe(1);
    expect(recallAtK(hits, ['source-b'], 1)).toBe(0);
    expect(recallAtK(hits, ['source-b'], 2)).toBe(1);
  });

  it('computes MRR', () => {
    expect(meanReciprocalRank(hits, ['source-a'])).toBe(1);
    expect(meanReciprocalRank(hits, ['source-b'])).toBe(0.5);
    expect(meanReciprocalRank(hits, ['source-c'])).toBeCloseTo(1 / 3);
  });

  it('computes keyword recall in top-k content', () => {
    expect(keywordRecall(hits, ['ERR-404'], 2)).toBe(1);
    expect(keywordRecall(hits, ['ActoCore', 'ERR-404'], 2)).toBe(1);
    expect(keywordRecall(hits, ['ActoCore', 'missing'], 1)).toBe(0.5);
  });

  it('parses fixture files', () => {
    const fixture = parseRagEvalFixture({
      name: 'demo',
      cases: [{ query: 'What is ActoCore?', expectedSourceIds: ['s1'] }],
    });

    expect(fixture.name).toBe('demo');
    expect(fixture.cases).toHaveLength(1);
  });

  it('summarizes case metrics', () => {
    const report = summarizeEvalReport(
      'project-1',
      'fixture.json',
      2,
      [
        evaluateCase(
          {
            query: 'What is ActoCore?',
            expectedSourceIds: ['source-a'],
            expectedKeywords: ['ActoCore'],
          },
          hits,
          2,
        ),
        evaluateCase(
          {
            query: 'ERR-404',
            expectedSourceIds: ['source-b'],
            expectedKeywords: ['ERR-404'],
          },
          hits,
          2,
        ),
      ],
    );

    expect(report.meanRecallAtK).toBe(1);
    expect(report.meanMrr).toBeGreaterThan(0);
    expect(report.meanKeywordRecall).toBe(1);
  });

  it('checks threshold gates', () => {
    const report = summarizeEvalReport(
      'project-1',
      'fixture.json',
      2,
      [
        evaluateCase(
          { query: 'What is ActoCore?', expectedSourceIds: ['source-a'] },
          hits,
          2,
        ),
      ],
    );

    expect(evalReportMeetsThresholds(report, { meanRecallAtK: 1 }).ok).toBe(true);
    expect(evalReportMeetsThresholds(report, { meanRecallAtK: 1.1 }).ok).toBe(
      false,
    );
    expect(() =>
      assertEvalReportMeetsThresholds(report, { meanRecallAtK: 1.1 }),
    ).toThrow(/thresholds not met/);
  });
});
