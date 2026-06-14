import type { RagRankedHit } from '../rag-retrieval.types';
import type {
  RagEvalCase,
  RagEvalCaseResult,
  RagEvalFixtureFile,
  RagEvalReport,
} from '../rag-eval.types';

export interface RagEvalRetrievalPort {
  retrieve(
    projectId: string,
    query: string,
    topK?: number,
  ): Promise<{
    rankedHits: RagRankedHit[];
    emptyReason?: string;
  }>;
}

export interface RagEvalThresholds {
  meanRecallAtK?: number;
  meanMrr?: number;
  meanKeywordRecall?: number;
}

/** Default gates for CI eval on stub-embedded seed knowledge. */
export const RAG_EVAL_CI_THRESHOLDS: Required<RagEvalThresholds> = {
  meanRecallAtK: 1,
  meanMrr: 0.5,
  meanKeywordRecall: 1,
};

export function recallAtK(
  rankedHits: RagRankedHit[],
  expectedSourceIds: string[],
  k: number,
): number {
  if (expectedSourceIds.length === 0) {
    return 1;
  }

  const expected = new Set(expectedSourceIds);
  const top = rankedHits.slice(0, k);

  return top.some((hit) => expected.has(hit.sourceId)) ? 1 : 0;
}

export function meanReciprocalRank(
  rankedHits: RagRankedHit[],
  expectedSourceIds: string[],
): number {
  if (expectedSourceIds.length === 0) {
    return 1;
  }

  const expected = new Set(expectedSourceIds);

  for (let index = 0; index < rankedHits.length; index += 1) {
    if (expected.has(rankedHits[index]!.sourceId)) {
      return 1 / (index + 1);
    }
  }

  return 0;
}

export function keywordRecall(
  rankedHits: RagRankedHit[],
  expectedKeywords: string[],
  k: number,
): number {
  if (expectedKeywords.length === 0) {
    return 1;
  }

  const blob = rankedHits
    .slice(0, k)
    .map((hit) => hit.content)
    .join(' ')
    .toLowerCase();

  const matched = expectedKeywords.filter((keyword) =>
    blob.includes(keyword.toLowerCase()),
  );

  return matched.length / expectedKeywords.length;
}

export function evaluateCase(
  testCase: RagEvalCase,
  rankedHits: RagRankedHit[],
  topK: number,
  emptyReason?: string,
): RagEvalCaseResult {
  return {
    query: testCase.query,
    recallAtK: recallAtK(rankedHits, testCase.expectedSourceIds ?? [], topK),
    mrr: meanReciprocalRank(rankedHits, testCase.expectedSourceIds ?? []),
    keywordRecall: keywordRecall(
      rankedHits,
      testCase.expectedKeywords ?? [],
      topK,
    ),
    emptyReason,
    topSourceIds: rankedHits.slice(0, topK).map((hit) => hit.sourceId),
  };
}

export function summarizeEvalReport(
  projectId: string,
  fixturePath: string,
  topK: number,
  caseResults: RagEvalCaseResult[],
): RagEvalReport {
  const count = caseResults.length || 1;

  return {
    projectId,
    fixturePath,
    topK,
    caseResults,
    meanRecallAtK:
      caseResults.reduce((sum, row) => sum + row.recallAtK, 0) / count,
    meanMrr: caseResults.reduce((sum, row) => sum + row.mrr, 0) / count,
    meanKeywordRecall:
      caseResults.reduce((sum, row) => sum + row.keywordRecall, 0) / count,
  };
}

export function parseRagEvalFixture(raw: unknown): RagEvalFixtureFile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Fixture must be a JSON object');
  }

  const fixture = raw as RagEvalFixtureFile;

  if (!Array.isArray(fixture.cases) || fixture.cases.length === 0) {
    throw new Error('Fixture must include a non-empty "cases" array');
  }

  for (const [index, testCase] of fixture.cases.entries()) {
    if (!testCase?.query?.trim()) {
      throw new Error(`Fixture case ${index} is missing "query"`);
    }
  }

  return fixture;
}

export function formatEvalReport(report: RagEvalReport): string {
  const lines = [
    `RAG eval — project=${report.projectId} fixture=${report.fixturePath} topK=${report.topK}`,
    `mean recall@${report.topK}=${report.meanRecallAtK.toFixed(3)} mrr=${report.meanMrr.toFixed(3)} keywordRecall=${report.meanKeywordRecall.toFixed(3)}`,
    '',
  ];

  for (const row of report.caseResults) {
    lines.push(
      [
        `- query="${row.query}"`,
        `recall@${report.topK}=${row.recallAtK.toFixed(3)}`,
        `mrr=${row.mrr.toFixed(3)}`,
        `keywords=${row.keywordRecall.toFixed(3)}`,
        row.emptyReason ? `empty=${row.emptyReason}` : null,
        row.topSourceIds.length > 0
          ? `topSources=${row.topSourceIds.join(',')}`
          : 'topSources=none',
      ]
        .filter(Boolean)
        .join(' '),
    );
  }

  return `${lines.join('\n')}\n`;
}

export async function runRagEval(options: {
  retrieval: RagEvalRetrievalPort;
  projectId: string;
  fixture: RagEvalFixtureFile;
  topK: number;
  fixturePath?: string;
}): Promise<RagEvalReport> {
  const caseResults: RagEvalCaseResult[] = [];

  for (const testCase of options.fixture.cases) {
    const result = await options.retrieval.retrieve(
      options.projectId,
      testCase.query,
      options.topK,
    );

    caseResults.push(
      evaluateCase(
        testCase,
        result.rankedHits,
        options.topK,
        result.emptyReason,
      ),
    );
  }

  return summarizeEvalReport(
    options.projectId,
    options.fixturePath ?? options.fixture.name ?? 'inline',
    options.topK,
    caseResults,
  );
}

export function evalReportMeetsThresholds(
  report: RagEvalReport,
  thresholds: RagEvalThresholds,
): { ok: boolean; failures: string[] } {
  const failures: string[] = [];

  if (
    thresholds.meanRecallAtK !== undefined &&
    report.meanRecallAtK < thresholds.meanRecallAtK
  ) {
    failures.push(
      `mean recall@${report.topK}=${report.meanRecallAtK.toFixed(3)} < ${thresholds.meanRecallAtK}`,
    );
  }

  if (
    thresholds.meanMrr !== undefined &&
    report.meanMrr < thresholds.meanMrr
  ) {
    failures.push(
      `mean mrr=${report.meanMrr.toFixed(3)} < ${thresholds.meanMrr}`,
    );
  }

  if (
    thresholds.meanKeywordRecall !== undefined &&
    report.meanKeywordRecall < thresholds.meanKeywordRecall
  ) {
    failures.push(
      `mean keywordRecall=${report.meanKeywordRecall.toFixed(3)} < ${thresholds.meanKeywordRecall}`,
    );
  }

  return { ok: failures.length === 0, failures };
}

export function assertEvalReportMeetsThresholds(
  report: RagEvalReport,
  thresholds: RagEvalThresholds,
): void {
  const { ok, failures } = evalReportMeetsThresholds(report, thresholds);

  if (!ok) {
    throw new Error(`RAG eval thresholds not met: ${failures.join('; ')}`);
  }
}
