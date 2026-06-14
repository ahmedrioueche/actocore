# ActoCore Backend

NestJS API for the embeddable SDK and the web control plane (Studio routes without a Studio UI yet).

**Developer guide (daily workflow, env, tests):** [DEV.md](./DEV.md)

- Architecture: [`_docs/backend/ARCHITECTURE.md`](../../_docs/backend/ARCHITECTURE.md), [`_docs/backend/OVERVIEW.md`](../../_docs/backend/OVERVIEW.md)
- Product context: [`_docs/PROJECT.md`](../../_docs/PROJECT.md)
- Implementation checklist: [`ROADMAP.md`](../../ROADMAP.md)

All versioned routes use the global prefix from `API_VERSION` (default `v1`), e.g. `http://localhost:3000/v1/...`.

---

## Local setup

```bash
# From repo root — MongoDB + Redis
docker compose -f compose.yml up -d

cd apps/backend
cp .env.example .env
npm install
npm run start:dev
```

Health (no API version prefix):

- `GET /health` — liveness
- `GET /health/ready` — readiness (MongoDB)

Configure MongoDB, Redis, LLM, embeddings, knowledge storage, and voice in [`.env.example`](./.env.example).

---

## Authentication

| Entry | Prefix | Auth today |
|--------|--------|------------|
| **SDK** | `/v1/sdk/*` | `Authorization: Bearer <project-api-key>` (`ApiKeyGuard`) |
| **Web (control plane / Studio)** | `/v1/web/*` | **Target:** signup/login + RBAC session. **Today:** interim guard optional via env (see below) |

Studio users (dashboard) are **separate** from project API keys (embeddable SDK).

**Product direction:** Studio = web app with signup/login and roles (super admin, user admin, user editor). See [STUDIO_BACKEND.md](./STUDIO_BACKEND.md).

**Interim (until login ships):** in `development`, `/web/*` is usually open; optional `STUDIO_AUTH_REQUIRED=true` + `STUDIO_DEV_TOKEN` for a single shared secret (not RBAC).

```bash
# When STUDIO_AUTH_REQUIRED=true (or production):
STUDIO_HEADER="Authorization: Bearer $STUDIO_DEV_TOKEN"

curl -X POST http://localhost:3000/v1/web/projects \
  -H "Content-Type: application/json" \
  -H "$STUDIO_HEADER" \
  -d '{"name":"My app"}'

curl -X POST http://localhost:3000/v1/web/api-keys \
  -H "Content-Type: application/json" \
  -H "$STUDIO_HEADER" \
  -d '{"projectId":"PROJECT_ID","label":"dev"}'
```

Then use the issued project API key on `/v1/sdk/*` (playground `VITE_ACTOCORE_API_KEY` or `ActocoreProvider`).

### Studio auth (`/v1/web/auth`)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/web/auth/signup` | Email + password; sends verification link |
| `POST` | `/web/auth/verify-email` | `{ token }` → session |
| `POST` | `/web/auth/resend-verification` | `{ email }` |
| `POST` | `/web/auth/login` | Owner: `{ email, password }`. Seat: `{ workspaceId, username, password }` |
| `POST` | `/web/auth/refresh` | `{ refreshToken }` |
| `POST` | `/web/auth/logout` | Bearer required |
| `GET` | `/web/auth/me` | Bearer required |
| `PATCH` | `/web/auth/me` | `{ displayName?, picture? }` |
| `GET/PATCH` | `/web/account` | Workspace settings (admin for PATCH) |
| `GET/PATCH` | `/web/account/preferences` | Email notification toggles |
| `POST` | `/web/auth/forgot-password` | `{ email }` |
| `POST` | `/web/auth/reset-password` | `{ token, password }` |
| `POST` | `/web/auth/change-password` | Bearer required |
| `GET` | `/web/auth/google` | OAuth URL |
| `GET` | `/web/auth/google/callback` | Google redirect (server) |
| `GET/POST/PATCH/DELETE` | `/web/auth/members` (+ `/:userId`) | Team seats (admin) |
| `POST` | `/web/auth/delete-account/request-otp` | Owner only — sends 6-digit code to email |
| `POST` | `/web/auth/delete-account/confirm` | Owner: deletes workspace when sole member. Seats: use admin `DELETE /members/:userId` |

### Studio billing (`/v1/web/billing`, Paddle)

Plans are stored in MongoDB (`studio_plans`) and managed by **super admin** (`role: super_admin`). Subscriptions are per **Studio account** (`studio_subscriptions.accountId`).

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/web/billing/plans` | Public | Active plans for pricing UI |
| `GET` | `/web/billing/subscription` | Admin + `billing.read` | Current subscription + limits + usage |
| `GET` | `/web/billing/payments` | Admin + `billing.read` | Payment / subscription history |
| `POST` | `/web/billing/paypal/checkout` | Admin + `billing.write` | `{ planId, billingCycle? }` → PayPal approval URL |
| `GET` | `/web/billing/paypal/subscription/:id` | Admin + `billing.write` | PayPal subscription status |
| `GET` | `/web/billing/paypal/manage-url` | Admin + `billing.read` | PayPal account subscriptions URL |
| `POST` | `/web/billing/subscription/cancel` | Admin + `billing.write` | `{ reason? }` |
| `POST` | `/web/billing/subscription/reactivate` | Admin + `billing.write` | Undo scheduled cancellation |
| `POST` | `/web/billing/subscription/downgrade` | Admin + `billing.write` | Schedule lower plan at period end |
| `POST` | `/web/billing/subscription/cancel-pending-change` | Admin + `billing.write` | Undo scheduled downgrade |
| `POST` | `/web/billing/paypal/webhook` | PayPal signature | Webhook |

**Super-admin plan catalog** (`/v1/web/admin/plans`): CRUD — requires JWT with `super_admin` role. Plans include `features[]` (marketing bullets), `pricing`, `limits`, and PayPal plan IDs. Tenants read active plans via `GET /web/billing/plans`; edits apply without redeploy.

Example — update Starter features:

```bash
PATCH /v1/web/admin/plans/:mongoId
{ "features": ["Everything in Free", "Up to 3 projects", "..."] }
```

Example — add a new paid tier (reuse `premium` level for rank above Pro):

```bash
POST /v1/web/admin/plans
{ "planId": "business", "level": "premium", "name": "Business", ... }
```

Env: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_BASE_URL`, `PAYPAL_RETURN_URL`, `PAYPAL_CANCEL_URL`, and `PAYPAL_PLAN_*` IDs from `npm run seed:paypal-catalog`.

Shared client: `billingApi`, `plansAdminApi` from `@ahmedrioueche/actocore-shared`.

Seed default catalog (Free, Starter, Pro; deactivates legacy Premium): `npm run seed:plans` from `apps/backend`. Run `npm run seed:paypal-catalog` first to create PayPal billing plans.

---

## SDK routes (`/v1/sdk`)

Require project API key.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/sdk/runtime` | Feature flags + dashboard SDK config (`sdk` field) |
| `POST` | `/sdk/sessions` | Create chat session |
| `GET` | `/sdk/sessions/:sessionId` | Get session |
| `GET` | `/sdk/sessions/:sessionId/messages` | List messages |
| `POST` | `/sdk/chat` | Send message (orchestrator: Q&A / actions) |
| `GET` | `/sdk/actions` | List actions enabled for project |
| `POST` | `/sdk/voice/transcribe` | Server STT (`multipart` field `audio`, optional `?language=`) |

### Runtime config

`GET /v1/sdk/runtime` returns `RuntimeConfigData`: `apiVersion`, `projectId`, `features`, `voice` (whether server transcription is available), and `sdk` (`SdkProjectConfigData` from the project record).

The React SDK merges `sdk` when `loadRemoteConfig` is enabled on `ActocoreProvider` (local props win over dashboard).

### Voice

- Env: `VOICE_STT_PROVIDER=stub|openai`, `OPENAI_API_KEY` when `openai`, `VOICE_MAX_AUDIO_BYTES`
- `stub`: demo phrase only for server mode
- `openai`: Whisper via `POST /v1/sdk/voice/transcribe`
- Browser dictation does not require server STT

---

## Web / control plane (`/v1/web`)

Protected by `StudioAuthGuard` when `STUDIO_AUTH_REQUIRED` is true (production default).

### Projects

| Method | Path |
|--------|------|
| `GET` | `/web/projects` — list (optional `?limit=`, default 50, max 200) |
| `POST` | `/web/projects` |
| `GET` | `/web/projects/:projectId` |
| `PATCH` | `/web/projects/:projectId` — rename (`name`) |
| `DELETE` | `/web/projects/:projectId` — admin; cascades keys, knowledge, sessions |
| `GET` | `/web/projects/:projectId/api-keys` — list metadata (`?includeRevoked=true`) |
| `POST` | `/web/projects/:projectId/api-keys/rotate-all` — revoke all active keys |
| `PATCH` | `/web/projects/:projectId/settings` |

### API keys

| Method | Path |
|--------|------|
| `POST` | `/web/api-keys` |
| `DELETE` | `/web/api-keys/:keyId` |

### Actions

| Method | Path |
|--------|------|
| `POST` | `/web/projects/:projectId/actions` |
| `GET` | `/web/projects/:projectId/actions` |
| `GET` | `/web/projects/:projectId/actions/:actionId` |
| `PATCH` | `/web/projects/:projectId/actions/:actionId` |
| `DELETE` | `/web/projects/:projectId/actions/:actionId` |

### SDK config (dashboard-driven widget settings)

Persisted on the project as `sdkConfig` with monotonic `sdkConfigVersion`. PATCH is partial; validated against shared DTOs. Orchestrator also enforces `security.allowedActionNames` when set.

| Method | Path |
|--------|------|
| `GET` | `/web/projects/:projectId/sdk-config` |
| `PATCH` | `/web/projects/:projectId/sdk-config` |

Example:

```bash
curl -X PATCH "http://localhost:3000/v1/web/projects/PROJECT_ID/sdk-config" \
  -H "Content-Type: application/json" \
  -d '{"ui":{"showIntentBadge":true},"i18n":{"locale":"fr"},"security":{"allowedActionNames":["list_users"]}}'
```

Shape: `SdkProjectConfigData` in `@ahmedrioueche/actocore-shared` (`i18n`, `theme`, `security`, `ui`, `voice`). Client: `sdkConfigApi` in shared package.

### Usage (platform operator)

`super_admin` only — `/v1/web/admin/usage/...` (project/account summaries, series, export, knowledge, sessions).

### Quota (tenant)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| `GET` | `/web/billing/quota` | `billing.read` | Monthly used/limit %, rate caps; emails at 80/90/100% |

SDK chat returns `QUOTA_EXCEEDED` (429) with an end-user message when limits are hit.

---

## Knowledge (RAG)

Ingestion is **control-plane only** (web routes). Chat consumes chunks via `POST /v1/sdk/chat` when intent is Q&A.

Storage: MongoDB `knowledge_sources` + `knowledge_chunks` (text + embeddings). Uploaded originals on disk under `KNOWLEDGE_STORAGE_PATH` (default `.data/knowledge`).

### Support matrix

| Input | Supported | API |
|--------|-----------|-----|
| Plain text | Yes | `POST .../knowledge` JSON `type: "text"`, `title`, `content` |
| Public URL (HTML) | Yes | `POST .../knowledge` JSON `type: "url"`, `title`, `url` |
| URL → PDF | Partial | Same URL route; PDF when `Content-Type` or magic bytes indicate PDF |
| PDF / `.txt` / `.md` upload | Yes | `POST .../knowledge/upload` multipart (`file`, optional `?title=`) |
| JSON `type: "document"` | No | Use upload route instead |
| Excel / Word | No | Phase 2 |
| Private / auth URLs | No | Phase 2 |
| S3 blob storage | No | Local disk v1 only |

Allowed upload types: `application/pdf`, `text/plain`, `text/markdown` (and extension fallbacks — see `KNOWLEDGE_*` in shared). Max size: `KNOWLEDGE_MAX_UPLOAD_BYTES` (default 10 MiB).

### Knowledge HTTP API

| Method | Path |
|--------|------|
| `POST` | `/web/projects/:projectId/knowledge` — JSON create (`text` \| `url`) |
| `POST` | `/web/projects/:projectId/knowledge/upload` — multipart `file` |
| `GET` | `/web/projects/:projectId/knowledge` — list sources |
| `GET` | `/web/projects/:projectId/knowledge/:sourceId` |
| `DELETE` | `/web/projects/:projectId/knowledge/:sourceId` — removes chunks + stored file |

**Text example:**

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge" \
  -H "Content-Type: application/json" \
  -d '{"type":"text","title":"FAQ","content":"ActoCore connects apps to AI..."}'
```

**URL example:**

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge" \
  -H "Content-Type: application/json" \
  -d '{"type":"url","title":"Docs","url":"https://example.com/docs"}'
```

**Upload example:**

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge/upload?title=Manual" \
  -F "file=@./manual.pdf"
```

Sources move `pending` → `ready` \| `error` after chunking + embedding. Scanned PDFs without extractable text fail ingestion.

### Embeddings (production RAG)

Default: `EMBEDDING_PROVIDER=stub` (deterministic fake vectors for dev).

For real retrieval quality (independent of chat `LLM_PROVIDER`):

**OpenAI:**
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

**Google/Gemini (same API key as chat):**
```env
EMBEDDING_PROVIDER=google
GEMINI_API_KEY=...
GOOGLE_EMBEDDING_MODEL=gemini-embedding-001
```

Chat answers still use `LLM_PROVIDER` (e.g. `google` + `GEMINI_API_KEY`).

Re-index all knowledge sources after switching embedding providers.

Shared client: `knowledgeApi` in `@ahmedrioueche/actocore-shared`.

---

## Integration testing

Use [`apps/sdk-playground`](../sdk-playground/README.md): seed actions/knowledge, exercise chat, voice, and `loadRemoteConfig` against this backend. See also [SDK DEV.md](../../packages/sdk/DEV.md).

```bash
cd apps/sdk-playground
cp .env.example .env   # set VITE_ACTOCORE_API_KEY
npm run seed:actions
npm run seed:knowledge
npm run dev
```

---

## Tests

```bash
npm run test        # unit
npm run test:e2e    # API e2e (may use in-memory Mongo)
```

---

## Related packages

- [`packages/shared`](../../packages/shared) — DTOs, types, HTTP clients (`chatApi`, `knowledgeApi`, `sdkConfigApi`, …)
- [`packages/sdk`](../../packages/sdk/README.md) — embeddable React chat widget
