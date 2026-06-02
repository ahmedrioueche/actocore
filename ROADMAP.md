# ActoCore Roadmap

Implementation checklist for the **Core backend** (`apps/backend`), aligned with [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md) and [`_docs/backend/OVERVIEW.md`](_docs/backend/OVERVIEW.md).

Update **Current focus** at the start of each work session.

---

## Current focus

**Core backend MVP:** feature-complete for SDK chat loop. Next: Studio/web auth, SDK package wiring.

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

- [x] LLM provider adapter (OpenAI / Claude / Gemini)
- [x] Session management (create, continue, list messages) — MongoDB `chat_sessions` / `chat_messages`
- [x] `POST /v1/sdk/chat` entry for SDK messages
- [x] Intent classification: Q&A vs Action vs direct response (heuristic stub)
- [x] Orchestration pipeline: context → classify → branch → format
- [x] Token usage capture per request
- [x] Mock/stub orchestrator for development before live LLM

---

## Action mode (tools domain)

_Execute validated actions inside host applications._

- [x] Action/tool registry per project (JSON schema definitions)
- [x] CRUD for actions (web control plane)
- [x] Validate AI-selected action against schema
- [x] Safe execution path and structured result DTO
- [x] Return action results to SDK for UI rendering

---

## Q&A mode (RAG domain)

_Knowledge-based responses._

- [x] Knowledge source metadata (documents, URLs, files)
- [x] Chunk storage and embedding generation
- [x] Retrieval for user questions
- [x] Inject retrieved context into LLM prompt
- [x] Return formatted Q&A response to SDK

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

- [x] Standard success/error response shape (`ApiResponse`)
- [x] Map internal errors to `errorCode` values
- [x] Unify Q&A, Action, and direct response paths through one formatter

---

## Observability

_Logs, decisions, actions, latency._

- [x] Log all incoming requests (project, route, latency)
- [x] Log AI decisions (intent, model, tokens)
- [x] Log executed actions and failures
- [x] Error and latency monitoring hooks

---

## Billing and usage

_Quotas and consumption per project._

- [x] Usage events per request (tokens, calls)
- [x] Aggregate usage per project
- [x] Rate limits and quota enforcement
- [x] Data exposed for Studio analytics

---

## Shared package (`@actocore/shared`)

_Types and API client used by backend, web, and SDK — per [`_docs/RULES.md`](_docs/RULES.md)._

- [x] Define DTOs in `packages/shared` before each backend endpoint
- [x] Implement Core HTTP calls in `packages/shared/src/api/`
- [x] Backend imports types from `@actocore/shared` only (no duplicate DTOs)
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
