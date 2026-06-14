# RAG professionalization plan

> **Status:** Planning — MVP RAG is shipped; this document defines the path to production-grade retrieval.
>
> **Scope:** `apps/backend/src/knowledge/`, Studio knowledge UI, shared types as needed.
>
> **Related:** [`ROADMAP.md`](../../ROADMAP.md) § Q&A mode · [`apps/backend/DEV.md`](../../apps/backend/DEV.md) · [`apps/backend/README.md`](../../apps/backend/README.md)

---

## Current state (baseline)

| Component | Implementation | Location |
|-----------|----------------|----------|
| Ingest | Text, URL (HTML strip), PDF/txt/md upload | `knowledge-ingest.service.ts` |
| Chunking | Fixed 800 chars, 100 overlap | `utils/text-chunker.ts` |
| Embeddings | OpenAI `text-embedding-3-small` or stub | `embedding/` |
| Storage | MongoDB `knowledge_chunks` with `number[]` embeddings | `schemas/knowledge-chunk.schema.ts` |
| Retrieval | Load **all** project chunks, cosine similarity in Node | `rag-retrieval.service.ts` |
| QA | Inject context + citations into orchestrator prompt | `qa-runner.service.ts` |
| Citations | Top 2, score thresholds, dedupe by source | `rag-retrieval.service.ts` |

**Works for:** demos, small doc sets, early customers.

**Breaks down when:** chunk count grows (latency/cost), docs have structure (headings, tables), users ask with exact terms (SKUs, error codes), or uploads are large (sync ingest).

---

## Goals

1. **Accuracy** — answers grounded in customer docs; citations users trust.
2. **Latency** — retrieval stays sub-200ms p95 at 10k+ chunks per project.
3. **Reliability** — async ingest, clear source status, retries.
4. **Observability** — measure retrieval quality; tune without guesswork.
5. **Product fit** — optional page/source scoping aligned with App Layout (`hostContext`).

---

## Non-goals (for now)

- OCR for scanned PDFs (document as future phase)
- Excel/Word parsers (already on main ROADMAP)
- S3 storage driver (already on main ROADMAP)
- Agentic multi-hop RAG before hybrid search + rerank ship
- Customer-facing embedding model choice in Studio

---

## Phase 1 — Retrieval quality (2–3 weeks)

*Highest ROI; minimal infra change.*

### 1.1 Structure-aware chunking

**Problem:** Character splits break sentences and ignore document structure.

**Tasks**

- [x] Add markdown chunker: split on `#` headings; preserve `headingPath[]` per chunk
- [x] Add paragraph-aware splitter before char limit (~512 tokens target, ~15% overlap)
- [x] For PDF: attach `page` number from `pdf-parse` page breaks where possible
- [x] Extend `KnowledgeChunk` schema with optional `metadata` object
- [x] Migration: re-index existing sources on next upload (no backfill job required for v1)

**Files:** `text-chunker.ts`, `knowledge-chunk.schema.ts`, `knowledge-ingest.service.ts`, `packages/shared/src/types/knowledge.ts`

**Acceptance:** Upload a markdown FAQ; retrieval returns chunks that start at section boundaries; citations show section title.

---

### 1.2 Batched embeddings on ingest

**Problem:** One OpenAI call per chunk; slow and expensive for large PDFs.

**Tasks**

- [x] Extend `EmbeddingProvider` with `embedBatch(texts: string[]): Promise<number[][]>`
- [x] Implement batching in `OpenAiEmbeddingProvider` (OpenAI accepts array `input`)
- [x] Use batches in `ingestExtractedText` (e.g. 64 chunks per request)
- [x] Keep stub provider compatible for tests

**Files:** `embedding-provider.interface.ts`, `openai-embedding.provider.ts`, `stub-embedding.provider.ts`, `knowledge-ingest.service.ts`

**Acceptance:** 50-chunk document ingests in one batch call; unit test mocks batch API.

---

### 1.3 Hybrid search (vector + keyword)

**Problem:** Pure vector misses exact product names, error codes, IDs.

**Tasks**

- [x] Add MongoDB text index on `content` (per project compound index)
- [x] Implement keyword score (in-memory token overlap) in `RagRetrievalService`
- [x] Merge vector + keyword scores (weighted: default 0.7 vector + 0.3 keyword)
- [x] Env: `RAG_HYBRID_KEYWORD_WEIGHT` (default 0.3)
- [x] Increase candidate pool before final top-k (retrieve 20, return 4)

**Files:** `rag-retrieval.service.ts`, `knowledge-chunk.schema.ts`, `apps/backend/.env.example`

**Acceptance:** Query containing exact doc phrase ranks relevant chunk in top 3; spec with seeded chunks.

---

### 1.4 Reranking

**Problem:** Embedding similarity alone is a weak ranker for Q&A.

**Tasks**

- [x] Add optional rerank step after hybrid retrieval (top 20 → rerank → top 4)
- [x] Provider interface: `RerankProvider` (Cohere Rerank)
- [x] Env: `RERANK_PROVIDER=none|cohere`, `COHERE_API_KEY`
- [x] Fall back to hybrid scores when rerank disabled or API fails

**Files:** new `knowledge/rerank/`, `rag-retrieval.service.ts`

**Acceptance:** Golden test set of 10 Q→chunk pairs improves recall@4 vs baseline (document scores in spec or script).

---

### 1.5 Query rewrite (optional in Phase 1)

**Tasks**

- [x] Before retrieval, optional LLM call: user message → search query (1 sentence)
- [x] Env flag: `RAG_QUERY_REWRITE=true` (default off in dev)
- [x] Cache rewrite per session + message hash in Redis (TTL 1h)

**Acceptance:** Conversational questions (“how do I add someone to my team?”) retrieve billing/team docs written with different wording.

---

## Phase 2 — Scale & ingest reliability (2–4 weeks)

### 2.1 Async ingest queue

**Problem:** Large uploads block HTTP request; Studio UX feels stuck.

**Tasks**

- [x] BullMQ job: `knowledge:ingest` (Redis already in stack)
- [x] Source status: `pending` → `indexing` → `ready` | `error`
- [x] Worker: extract → chunk → batch embed → write chunks
- [x] Retry with backoff; store `errorMessage` on failure
- [x] Studio: poll source status or SSE until ready

**Files:** `knowledge-ingest.service.ts`, new `knowledge-ingest.processor.ts`, `knowledge.module.ts`, Studio knowledge page

**Acceptance:** 5MB PDF upload returns 202 immediately; chunks appear within 2 min; failed ingest shows error in Studio.

---

### 2.2 Vector index (replace full scan)

> **Deferred** — skipped for now; in-memory hybrid search remains sufficient at current scale.

**Problem:** `find(all chunks)` + in-memory cosine does not scale.

**Options (pick one)**

| Option | Pros | Cons |
|--------|------|------|
| **MongoDB Atlas Vector Search** | Same DB, tenant filter native | Requires Atlas M10+ |
| **Qdrant** | Fast, filters, self-host | New service |
| **pgvector** | Mature | New database |

**Recommended:** MongoDB Atlas Vector Search if production uses Atlas; otherwise Qdrant sidecar.

**Tasks**

- [ ] Abstract `VectorStore` interface (`upsert`, `search`, `deleteBySource`)
- [ ] Implement Atlas Vector Search adapter
- [ ] Keep `content` + metadata in Mongo; embeddings in vector index (or dual-write during migration)
- [ ] Migration script: re-index all existing chunks
- [ ] Retrieval uses index only (no full collection load)

**Acceptance:** p95 retrieval < 200ms with 10k chunks; load test script in `apps/backend/scripts/`.

---

### 2.3 Parent–child chunks

**Problem:** Small chunks retrieve well but lack context for the LLM.

**Tasks**

- [x] Ingest creates `parent` records (section-level) and `child` records (search units)
- [x] Search on children; inject parent text into `contextBlock`
- [x] Schema: `parentChunkId` optional on `KnowledgeChunk`

**Acceptance:** Answer to multi-paragraph section uses full section context, not a 800-char fragment.

---

## Phase 3 — Product & observability (ongoing)

### 3.1 Grounding & prompt hardening

**Tasks**

- [x] Require citation markers `[1]` in QA answers when context provided
- [x] Stricter empty-retrieval path (already partially in `qa-runner.service.ts`)
- [x] Token budget: cap injected context (e.g. 4k tokens); truncate lowest-scoring chunks first
- [x] Log retrieval scores + chunk ids on each chat request (usage/analytics)

---

### 3.2 Studio: knowledge QA tools

**Tasks**

- [x] “Test retrieval” panel: enter question → show ranked chunks + scores (admin only)
- [x] Chunk preview on source detail page
- [x] “Re-index” button per source
- [x] Re-index API: `POST .../knowledge/:sourceId/reindex` (async ingest; text content persisted on source)
- [x] Assign sources to app pages in Studio (`PATCH .../knowledge/:sourceId` with `pageIds`; detail page page-scope UI)
- [ ] Source tags (`billing`, `onboarding`) → filter retrieval by tag or `hostContext.currentPage` (partial: pageIds scoping shipped)

---

### 3.3 Evaluation harness

**Tasks**

- [x] JSON fixture format: `{ query, expectedSourceIds[], expectedKeywords[] }`
- [x] CLI: `npm run rag:eval -- --project=...` reports recall@k, MRR
- [x] CI job (optional): run eval on seed knowledge with stub embeddings

**Files:** `apps/backend/scripts/rag-eval.ts`, `test/fixtures/rag/`

---

### 3.4 Ingestion upgrades (later)

- [x] URL: readability extraction (Readability.js or Firecrawl)
- [x] Sitemap crawl with depth/rate limits
- [x] Word/Excel parsers (see main ROADMAP)
- [ ] OCR pipeline for scanned PDFs

---

## Phase 4 — App-aware RAG (ties to product vision)

**Tasks**

- [x] Tag chunks with `pageIds[]` from App Layout when source is page-specific
- [x] Filter retrieval by `hostContext.currentPage` when set (boost, not hard filter initially)
- [x] Studio: assign knowledge sources to app pages
- [x] System prompt: prefer page-scoped docs when user is on that screen

**Related:** [`_docs/vision/AGENT-CAPABILITY-EXTENSION.md`](../vision/AGENT-CAPABILITY-EXTENSION.md)

---

## Suggested implementation order

```text
Phase 1.1  Structure-aware chunking
Phase 1.2  Batched embeddings
Phase 1.3  Hybrid search
Phase 1.4  Reranking
     ↓
Phase 2.1  Async ingest queue
Phase 2.2  Vector index
Phase 2.3  Parent–child chunks
     ↓
Phase 3    Studio tools + eval + logging
Phase 4    Page-aware retrieval
```

Ship Phase 1 as **one PR series** (chunking → batch → hybrid → rerank). Each step is independently testable.

---

## Env vars (planned)

| Variable | Purpose | Default |
|----------|---------|---------|
| `EMBEDDING_PROVIDER` | `openai` \| `stub` | `stub` in dev |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `RAG_TOP_K` | Chunks sent to LLM | `4` |
| `RAG_CANDIDATE_K` | Pre-rerank pool | `20` |
| `RAG_HYBRID_KEYWORD_WEIGHT` | Keyword blend | `0.3` |
| `RERANK_PROVIDER` | `none` \| `cohere` | `none` |
| `RAG_QUERY_REWRITE` | LLM query expansion | `false` |
| `RAG_MIN_SCORE` | Drop below threshold | `0.12` (today) |
| `RAG_CONTEXT_MAX_TOKENS` | Max tokens in injected RAG context | `4000` |

Document all in `apps/backend/.env.example` as each ships.

---

## Success metrics

| Metric | MVP today | Target (Phase 2 done) |
|--------|-----------|------------------------|
| Retrieval p95 latency | O(n) chunks | < 200ms @ 10k chunks |
| Recall@4 on seed FAQ | Baseline TBD | +30% vs MVP |
| Empty retrieval rate | Unknown | Logged; < 15% on seed set |
| Ingest time (50-page PDF) | Sync, minutes | Async; user sees progress |
| Citation click-through | N/A | Track in analytics (Phase 3) |

---

## Open decisions

1. **Atlas vs Qdrant** — depends on production Mongo hosting.
2. **Rerank vendor** — Cohere vs open-source vs skip in v1.
3. **Backfill** — re-index all tenants on chunk schema change vs lazy on re-upload.
4. **Page-scoped RAG** — hard filter vs boost (start with boost).

---

## First PR checklist (start here)

- [x] Markdown + paragraph chunking with `metadata.headingPath`
- [x] `embedBatch` on ingest
- [x] Unit tests: chunker, batch embed mock, hybrid score merge
- [x] Update `ROADMAP.md` Q&A section with link to this plan
