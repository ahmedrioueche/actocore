import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { RagEvalModule } from '../src/knowledge/rag-eval.module';
import { RagRetrievalService } from '../src/knowledge/rag-retrieval.service';
import type { RagEvalThresholds } from '../src/knowledge/utils/rag-eval.util';
import {
  assertEvalReportMeetsThresholds,
  formatEvalReport,
  parseRagEvalFixture,
  runRagEval,
} from '../src/knowledge/utils/rag-eval.util';

interface CliOptions {
  projectId: string;
  fixturePath: string;
  topK: number;
  thresholds?: RagEvalThresholds;
}

function parseThresholdArg(
  arg: string,
  prefix: string,
): number | undefined {
  const parsed = Number.parseFloat(arg.slice(prefix.length));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseArgs(argv: string[]): CliOptions {
  let projectId: string | undefined;
  let fixturePath = resolve(__dirname, '../test/fixtures/rag/default.json');
  let topK = 4;
  const thresholds: RagEvalThresholds = {};

  for (const arg of argv) {
    if (arg.startsWith('--project=')) {
      projectId = arg.slice('--project='.length).trim();
      continue;
    }
    if (arg.startsWith('--fixture=')) {
      fixturePath = resolve(process.cwd(), arg.slice('--fixture='.length).trim());
      continue;
    }
    if (arg.startsWith('--top-k=')) {
      const parsed = Number.parseInt(arg.slice('--top-k='.length), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        topK = parsed;
      }
      continue;
    }
    if (arg.startsWith('--min-recall-at-k=')) {
      thresholds.meanRecallAtK = parseThresholdArg(arg, '--min-recall-at-k=');
      continue;
    }
    if (arg.startsWith('--min-mrr=')) {
      thresholds.meanMrr = parseThresholdArg(arg, '--min-mrr=');
      continue;
    }
    if (arg.startsWith('--min-keyword-recall=')) {
      thresholds.meanKeywordRecall = parseThresholdArg(
        arg,
        '--min-keyword-recall=',
      );
    }
  }

  if (!projectId) {
    throw new Error(
      'Usage: npm run rag:eval -- --project=<projectId> [--fixture=path] [--top-k=4] [--min-recall-at-k=0.8] [--min-mrr=0.5] [--min-keyword-recall=1]',
    );
  }

  return {
    projectId,
    fixturePath,
    topK,
    thresholds:
      thresholds.meanRecallAtK !== undefined ||
      thresholds.meanMrr !== undefined ||
      thresholds.meanKeywordRecall !== undefined
        ? thresholds
        : undefined,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(readFileSync(options.fixturePath, 'utf8')) as unknown;
  const fixture = parseRagEvalFixture(raw);

  const app = await NestFactory.createApplicationContext(RagEvalModule, {
    logger: ['error', 'warn'],
  });

  try {
    const retrieval = app.get(RagRetrievalService);
    const report = await runRagEval({
      retrieval,
      projectId: options.projectId,
      fixture,
      topK: options.topK,
      fixturePath: options.fixturePath,
    });

    process.stdout.write(formatEvalReport(report));

    if (options.thresholds) {
      assertEvalReportMeetsThresholds(report, options.thresholds);
    }
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
