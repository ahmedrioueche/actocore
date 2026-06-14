# RAG evaluation fixtures

JSON files used by `npm run rag:eval`.

## Format

```json
{
  "name": "optional-label",
  "cases": [
    {
      "query": "What is ActoCore?",
      "expectedSourceIds": ["507f1f77bcf86cd799439011"],
      "expectedKeywords": ["ActoCore", "integration"]
    }
  ]
}
```

- `expectedSourceIds` — MongoDB knowledge source IDs; used for recall@k and MRR
- `expectedKeywords` — substring matches in top-k ranked chunk content

## Run

From `apps/backend`:

```bash
npm run rag:eval -- --project=<projectId>
npm run rag:eval -- --project=<projectId> --fixture=test/fixtures/rag/my-fixture.json --top-k=4
npm run rag:eval -- --project=<projectId> --min-keyword-recall=1 --min-recall-at-k=0.8
```

Uses `EMBEDDING_PROVIDER` from `.env` (stub by default). Point `expectedSourceIds` at real sources in your project for meaningful scores.

## CI

GitHub Actions runs `npm run test:rag-eval` in `.github/workflows/backend-ci.yml`. The e2e test seeds knowledge in memory, runs eval with stub embeddings, and asserts `RAG_EVAL_CI_THRESHOLDS`.
