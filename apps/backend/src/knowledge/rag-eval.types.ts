export interface RagEvalCase {
  query: string;
  expectedSourceIds?: string[];
  expectedKeywords?: string[];
}

export interface RagEvalFixtureFile {
  /** Optional label for reports. */
  name?: string;
  cases: RagEvalCase[];
}

export interface RagEvalCaseResult {
  query: string;
  recallAtK: number;
  mrr: number;
  keywordRecall: number;
  emptyReason?: string;
  topSourceIds: string[];
}

export interface RagEvalReport {
  projectId: string;
  fixturePath: string;
  topK: number;
  caseResults: RagEvalCaseResult[];
  meanRecallAtK: number;
  meanMrr: number;
  meanKeywordRecall: number;
}
