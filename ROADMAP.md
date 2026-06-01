# ActoCore Roadmap

Implementation checklist for the **Core backend** (`apps/backend`), aligned with [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md) and [`_docs/backend/OVERVIEW.md`](_docs/backend/OVERVIEW.md).

Update **Current focus** at the start of each work session.

---

## Current focus

**Request context builder:** complete. Next: **AI orchestrator** (stub → live LLM, chat pipeline).

---

## Infrastructure layer

_Database, Redis, external APIs, app bootstrap._

- [x] MongoDB connection module and environment config (`MONGODB_URI`)
- [x] Health check endpoint (API + database connectivity)
- [x] Redis integration (caching / sessions / rate limits per architecture)
- [x] External API client abstractions (LLM providers)
- [x] Global config module (`@nestjs/config`)
- [x] Global validation pipe and error handling baseline

---

## Entry layer

_SDK and web dashboard HTTP surface._

- [x] API versioning (`/v1` prefix)
- [x] SDK-facing routes (chat, sessions, runtime)
- [x] CORS and request size limits per entry type

---

## Authentication layer

_API keys, tokens, project-scoped access._

- [x] API key model (issue, hash, store, revoke)
- [x] Bearer token validation guard
- [x] Reject missing/invalid/revoked keys with structured errors
- [x] Update `lastUsedAt` / audit on key usage

---

## Request context builder

_Resolve project and attach context before orchestration._

- [x] Resolve `projectId` from authenticated key (or session)
- [x] Load project settings (system prompt, rules, tone)
- [x] Attach tenant/project context to request scope
- [x] Enforce multi-tenant isolation on every query

---

## AI orchestrator (core brain)

_Intent detection, routing, LLM communication._

- [ ] LLM provider adapter (OpenAI / Claude / Gemini)
- [ ] Session management (create, continue, list messages)
- [ ] `POST /v1/chat` (or equivalent) entry for SDK messages
- [ ] Intent classification: Q&A vs Action vs direct response
- [ ] Orchestration pipeline: context → classify → branch → format
- [ ] Token usage capture per request
- [ ] Mock/stub orchestrator for development before live LLM

---

## Action mode (tools domain)

_Execute validated actions inside host applications._

- [ ] Action/tool registry per project (JSON schema definitions)
- [ ] CRUD for actions (web control plane)
- [ ] Validate AI-selected action against schema
- [ ] Safe execution path and structured result DTO
- [ ] Return action results to SDK for UI rendering

---

## Q&A mode (RAG domain)

_Knowledge-based responses._

- [ ] Knowledge source metadata (documents, URLs, files)
- [ ] Chunk storage and embedding generation
- [ ] Retrieval for user questions
- [ ] Inject retrieved context into LLM prompt
- [ ] Return formatted Q&A response to SDK

---

## Projects domain (multi-tenant control plane)

_Per-project configuration for Studio and runtime._

- [x] Project model (name, settings, system prompt, behavior rules)
- [x] Project CRUD APIs (web) — create, get, patch settings
- [x] Link API keys and resources to `projectId`
- [x] No cross-project data access (tests required)

---

## Response formatter

_Consistent API output after orchestration._

- [ ] Standard success/error response shape (`ApiResponse`)
- [ ] Map internal errors to `errorCode` values
- [ ] Unify Q&A, Action, and direct response paths through one formatter

---

## Observability

_Logs, decisions, actions, latency._

- [ ] Log all incoming requests (project, route, latency)
- [ ] Log AI decisions (intent, model, tokens)
- [ ] Log executed actions and failures
- [ ] Error and latency monitoring hooks

---

## Billing and usage

_Quotas and consumption per project._

- [ ] Usage events per request (tokens, calls)
- [ ] Aggregate usage per project
- [ ] Rate limits and quota enforcement
- [ ] Data exposed for Studio analytics

---

## Shared package (`@actocore/shared`)

_Types and API client used by backend, web, and SDK — per [`_docs/RULES.md`](_docs/RULES.md)._

- [ ] Define DTOs in `packages/shared` before each backend endpoint
- [ ] Implement Core HTTP calls in `packages/shared/src/api/`
- [ ] Backend imports types from `@actocore/shared` only (no duplicate DTOs)
- [ ] SDK and web consume the same `api` modules

---

## Suggested build order

Follows the global request flow in ARCHITECTURE.md:

1. Infrastructure layer
2. Authentication layer + Projects domain
3. Request context builder
4. Entry layer (SDK chat route)
5. AI orchestrator (stub, then live LLM)
6. Q&A mode (RAG) and Action mode in parallel after orchestrator
7. Response formatter (can start early with Infrastructure)
8. Observability and Billing

---

## References

- [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md) — layers and request flow
- [`_docs/backend/OVERVIEW.md`](_docs/backend/OVERVIEW.md) — responsibilities
- [`_docs/PROJECT.md`](_docs/PROJECT.md) — product context
- [`_docs/RULES.md`](_docs/RULES.md) — implementation rules
