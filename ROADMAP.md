# ActoCore Roadmap

Implementation checklist for the ActoCore monorepo: **Core backend** (`apps/backend`), **shared contract** (`packages/shared`), **embeddable SDK** (`packages/sdk`), and **integration apps** for local testing.

Aligned with [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md), [`_docs/PROJECT.md`](_docs/PROJECT.md), and [`_docs/RULES.md`](_docs/RULES.md).

Update **Current focus** at the start of each work session.

---

## Current focus

**Studio tenant backend (user admin / editor, not super admin):** subscription & plan limits, richer usage/analytics per project, team management (update/remove), account & project settings — see [Studio tenant workspace](#studio-tenant-workspace-user-admin--editor--backend) below. **Done:** product auth + RBAC on `/v1/web/*`. **Later:** `apps/studio` UI, platform super-admin APIs, Excel/Word parsers, S3 knowledge storage.

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

_Knowledge-based responses. Ingestion API: `POST /v1/web/projects/:projectId/knowledge` (JSON). Storage: MongoDB `knowledge_sources` + `knowledge_chunks` (text + embeddings only — **no file blobs today**)._

### RAG pipeline (done)

- [x] Chunk + embed + retrieve + inject into LLM + citations on `POST /v1/sdk/chat`
- [x] `EMBEDDING_PROVIDER` stub | openai (`apps/backend/.env.example`)
- [x] List / get / delete knowledge sources (metadata only on source record)

### Backend ingest — what is supported now

| Input                            | Supported?  | How it works today (`apps/backend`)                                                                                  |
| -------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| **Plain text**                   | **Yes**     | `type: "text"` + `content` in JSON. Chunks only after ingest (not full `content` on source).                         |
| **External URLs**                | **Partial** | `type: "url"` — HTML strip; **PDF URLs** parsed when `Content-Type` or magic bytes indicate PDF. No auth-gated URLs. |
| **PDF / text / markdown upload** | **Yes**     | `POST .../knowledge/upload` multipart (`file`, optional `title`). PDF via `pdf-parse`; `.txt`/`.md` as UTF-8.        |
| **Excel / Word / etc.**          | **No**      | Phase 2 — no parsers yet.                                                                                            |
| **Multipart + storage**          | **Yes**     | Local disk under `KNOWLEDGE_STORAGE_PATH` (default `.data/knowledge`). S3 driver not implemented.                    |

_Playground:_ `npm run seed:knowledge -- --upload ./file.pdf` uses the real upload API.\_

### Backend — Knowledge ingest (build checklist)

_Implement missing rows in the table above. Order: storage + upload route → parsers → URL PDF → shared client → tests._

#### 1. Multipart upload API

- [x] `POST /v1/web/projects/:projectId/knowledge/upload` — `multipart/form-data` (`file`, optional `title`)
- [x] `memoryStorage` / size limit (`KNOWLEDGE_UPLOAD_MAX_BYTES` + env `KNOWLEDGE_MAX_UPLOAD_BYTES`)
- [x] Create `knowledge_sources` with `type: "document"`, `pending` → `ready` | `error`
- [x] JSON `POST .../knowledge` rejects `type: "document"` — use upload route

#### 2. Store originals (local disk v1)

- [x] Env: `KNOWLEDGE_STORAGE_PATH`, `KNOWLEDGE_MAX_UPLOAD_BYTES`
- [x] Schema: `storageKey`, `originalFilename`, `mimeType`, `byteSize`
- [x] Delete blob on source delete
- [ ] S3-compatible driver (prod) — phase 2

#### 3. Document parsers

- [x] **PDF** — `pdf-parse` (text PDFs; scanned/OCR out of scope)
- [x] **Plain text / markdown** — `.txt`, `.md`
- [ ] **Excel** `.xlsx` — phase 2
- [ ] **Word** `.docx` — phase 2
- [x] MIME + extension allowlist (`packages/shared` constants)
- [ ] Dedicated re-upload route (workaround: delete source + upload again)

#### 4. URL ingest improvements

- [x] PDF `Content-Type` / magic-byte detection on URL fetch
- [ ] Auth headers for private URLs (Studio config later)

#### 5. Shared package

- [x] `KnowledgeFileMetadata` on `KnowledgeSourceData`
- [x] `KNOWLEDGE_*` upload constants
- [x] `knowledgeApi.upload(projectId, file)`

#### 6. Tests and docs

- [x] E2e: upload `.txt` → `ready` + `file` metadata
- [x] Unit tests: MIME util, plain text extractor
- [x] E2e: PDF fixture + chat citation
- [x] Backend README: support matrix + env vars ([`apps/backend/README.md`](apps/backend/README.md))

#### 7. Follow-ups

- [ ] Large uploads: `chunkText` size/overlap tuning
- [x] `EMBEDDING_PROVIDER=openai` documented for production RAG ([`apps/backend/README.md`](apps/backend/README.md))

_Out of scope for this checklist:_ Studio drag-and-drop UI, SDK upload (knowledge is control-plane only).

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

## Shared package (`@ahmedrioueche/actocore-shared`)

_Types and API client used by backend, web, and SDK — per [`_docs/RULES.md`](_docs/RULES.md)._

- [x] Define DTOs in `packages/shared` before each backend endpoint
- [x] Implement Core HTTP calls in `packages/shared/src/api/`
- [x] Backend imports types from `@actocore/shared` only (no duplicate DTOs)
- [x] API modules cover SDK routes (`chat`, `sessions`, `runtime`)
- [ ] Pin/document compatible `shared` version for each SDK release

---

## SDK package (`packages/sdk`)

_Embedded React UI for customer apps. All Core HTTP calls go through `@ahmedrioueche/actocore-shared` — no direct `fetch`/`axios` in SDK components ([`RULES.md`](_docs/RULES.md))._

**Design principles (non‑negotiable):**

- **No hardcoded user-facing text** — every label, button, empty state, error, and action prompt goes through **i18n** (`react-i18next`).
- **No hardcoded colors, spacing, or typography in components** — styles use **CSS variables** (`--ac-*` design tokens) and `ActocoreThemeConfig`; consumers and future Studio override tokens, not fork components.
- **No hardcoded demo data in production components** — sample content only in playground/docs.
- **Composable, maintainable components** — small presentational pieces (`MessageList`, `Composer`, `SourceCitations`, `ActionPendingCard`, etc.) composed by `ActoChat`; avoid monolithic widgets.
- **Config-first** — `ActocoreProvider` accepts `i18n`, `theme`, `security`, and `ui` props today; later Studio loads the same shape from the control plane API.

**Status:** in progress — foundation + `ActoChat` UI implemented with i18n/theming/security; playground, publish, and tests pending.

### 1. Package foundation (publishable npm package)

- [x] Add `package.json` (`@ahmedrioueche/actocore-sdk`), `tsconfig`, build (`tsc` + copy `styles/tokens.css`)
- [x] Export map: main entry, `ActoChat`, `ActocoreProvider`, hooks, config types, `@ahmedrioueche/actocore-sdk/styles.css`
- [x] Peer dependencies: `react`, `react-dom` (document supported versions)
- [x] Dependency: `@ahmedrioueche/actocore-shared` (version range aligned with backend)
- [x] `ActocoreProvider` — `configureApi({ baseURL, apiKey, apiVersion })` + nested providers (i18n, theme, security context)
- [x] Document required env/config: API key (Bearer), Core base URL (e.g. `http://localhost:3000`) — [`packages/sdk/README.md`](packages/sdk/README.md)

### 2. Internationalization (i18n) — all UI text

_Align with [`RULES.md`](_docs/RULES.md) (web uses i18next); SDK must be locale-ready for global hosts and future Studio language settings._

- [x] `react-i18next` + `i18next` in SDK; bundled locale files (e.g. `src/i18n/locales/en.json`, `fr.json`)
- [x] **Zero hardcoded strings** in components — use `useTranslation()` / `t('…')` keys only
- [x] Namespaced keys: `chat.*`, `intent.*`, `sources.*`, `action.*`, `errors.*` (map `ApiResponse.errorCode` → `errors.<code>`)
- [x] `ActocoreI18nConfig` on provider: `locale` (BCP‑47), optional `translations` deep-merge over bundled locales
- [x] `changeLanguage` when `locale` prop changes (host or dashboard-driven)
- [x] Document how hosts override strings without forking components (pass `translations` on provider) — [`packages/sdk/README.md`](packages/sdk/README.md)
- [x] Control plane `GET/PATCH` project SDK settings — SDK reads via `loadRemoteConfig` + `GET /v1/sdk/runtime` (Studio UI still pending)

### 3. Theming and styles — no hardcoded look & feel

_SDK ships a default look via tokens, not inline colors. Hosts and Studio customize variables, not component source._

- [x] Ship `styles/tokens.css` with `--ac-*` variables (font, spacing, radius, semantic colors, chat layout)
- [x] Root wrapper `[data-actocore]` + optional `data-actocore-theme="light|dark"`; support `theme.mode: 'system'` via `prefers-color-scheme`
- [x] `ActocoreThemeConfig`: `mode`, `tokens` (map to `--ac-<name>`), optional `className`
- [x] Components use **token-backed CSS** (class modules or a single `components.css` referencing `var(--ac-…)` only — no `#2563eb`-style literals in TSX)
- [x] Export `@ahmedrioueche/actocore-sdk/styles.css` — documented in SDK README (“import tokens once in host app”)
- [x] Optional slot/className props per subcomponent for layout tweaks without breaking token contract
- [ ] Future (Studio): dashboard publishes theme JSON → host passes `theme.tokens` to provider (or injects CSS on parent)

### 4. Security and action allowlist

_Defense in depth: Core validates schemas; SDK enforces what the **host app** may execute._

- [x] `ActocoreSecurityConfig` on provider: `allowedActionNames?: string[]`, `enforceActionAllowlist?: boolean`, `hostContext?: Record<string, unknown>` (forward when backend supports it)
- [x] Before invoking a host handler: check allowlist; show i18n `action.denied` when blocked (never silent no-op)
- [x] Handler registry keyed by action **name**; clear i18n when handler missing (`action.handlerMissing`)
- [x] Document host responsibility: register only actions they implement; align allowlist with actions enabled in Studio
- [x] Project settings API returns allowed action names → runtime + `PATCH sdk-config`; SDK via `loadRemoteConfig` (Studio UI pending)

### 5. UI feature flags (dashboard-ready)

- [x] `ActocoreUiConfig`: `showSources`, `showIntentBadge`, `composerMinRows` / `composerMaxRows`, etc.
- [x] Components read flags from context — no hardcoded “always show sources”
- [x] Same flags stored per project (`sdk-config`) and passed into `ActocoreProvider` when `loadRemoteConfig` (Studio UI pending)

### 6. Data layer (hooks → shared `api/`)

- [x] `useActocoreRuntime()` — `GET /v1/sdk/runtime` (connectivity + feature flags)
- [x] `useActocoreSession()` — create session, optional `externalUserId` / metadata
- [x] `useActocoreChat()` — `chatApi.sendMessage`, hold `sessionId`, merge user + assistant messages in local state
- [x] Map `ApiResponse` errors to **i18n** messages via `errorCode` (fallback `errors.generic`)
- [x] Optional: load session history via `sessionsApi.listMessages`

### 7. UI components (chat widget)

- [x] `ActoChat` — composable root (uses provider context; no duplicate API config)
- [x] Subcomponents: `PageHeader` (SDK header), `MessageList`, `MessageBubble`, `Composer`, `ChatEmpty`, `ChatError`, `ChatLoading`
- [x] Loading, error, and empty states — **all copy via i18n**
- [x] **Direct / Q&A:** assistant text; `SourceCitations` when `intent === 'qa'` and `ui.showSources`
- [x] **Action:** `ActionPendingCard` when `action.status === 'pending'` (i18n + allowlist + handler bridge)
- [x] Intent badge optional via `ui.showIntentBadge` (i18n `intent.*` labels)

### 8. Action bridge (host app executes tools)

- [x] `actions` prop on provider (registry `Record<actionName, handler>`) — host registers handlers by action name
- [x] On `ChatMessageData.action` with `status: 'pending'`: allowlist check → handler with validated `input`
- [x] Surface handler errors in chat UI (i18n `action.failed`, no silent failures)
- [x] Document contract: Core validates schema; SDK runs logic in the customer app ([`PROJECT.md`](_docs/PROJECT.md))

### 9. Publish and install in an external project

- [x] Publish to GitHub Packages (or npm) with same registry flow as `actocore-shared`
- [x] `README.md`: install, import `styles.css`, `ActocoreProvider` (api + i18n + theme + security), `<ActoChat />`
- [x] Public npm publish (`publishConfig` + `publish:public` scripts); consumers: `npm install @ahmedrioueche/actocore-sdk` only
- [x] Verify install in a **clean directory** outside the monorepo (`npm pack` or registry version)

### 10. Example host app (integration testing in monorepo)

_Separate app to prove “install SDK → talk to real Core” without publishing every change._

- [x] Add `apps/sdk-playground` (or `examples/sdk-host`) — Vite + React + TypeScript
- [x] Depends on local `packages/sdk` (workspace) or packed tarball; depends on published `actocore-shared`
- [x] `.env.example`: `VITE_ACTOCORE_API_URL`, `VITE_ACTOCORE_API_KEY`
- [x] Seed script or docs: create project + API key via web routes — `npm run setup` writes `.env` ([`apps/sdk-playground/MANUAL_E2E.md`](apps/sdk-playground/MANUAL_E2E.md))
- [x] Demo page: `<ActocoreProvider>` with `locale`, `theme`, `security.allowedActionNames` + `<ActoChat />` + sample action handler
- [x] Playground toggles locale / theme to prove i18n and tokens (no hardcoded demo strings in SDK)
- [x] Root `package.json` script: `dev:infra`, `dev:backend`, `dev:playground`, `playground:setup` ([`package.json`](package.json))

### 11. Tests and quality

- [x] Unit tests: hooks (mock shared api), allowlist helper, i18n error mapping
- [x] Component tests: `ActoChat` send flow, locale switch, denied action UI (Vitest + RTL)
- [x] Unit tests: `mergeRemoteSdkConfig` merge order (local overrides dashboard)
- [ ] Manual E2E checklist: follow [`apps/sdk-playground/MANUAL_E2E.md`](apps/sdk-playground/MANUAL_E2E.md) and sign off
- [ ] Optional: Playwright smoke against playground + local Core

---

## Studio (web dashboard)

_Control plane — **tenant auth + RBAC shipped** on `/v1/web/*`; **next** subscription, analytics, team CRUD, settings for **user admin / editor** (not platform super admin). Plan: [`apps/backend/STUDIO_BACKEND.md`](apps/backend/STUDIO_BACKEND.md)._

### Studio product auth & guards (done)

- [x] Signup, email verify, login, refresh, logout, forgot/reset password, change password
- [x] Google OAuth (`GET /web/auth/google`, callback)
- [x] `GET /web/auth/me`, delete-account OTP (`request-otp` + `confirm`)
- [x] `StudioUser`, `StudioAccount`, `StudioMembership`; JWT + `StudioAuthGuard` + `StudioPermissionsGuard`
- [x] RBAC: `user_admin`, `user_editor` (+ `super_admin` role in model; **platform routes not built**)
- [x] Team seats (admin): `GET/POST/PATCH/DELETE /web/auth/members` (workspace username/password + projectIds)
- [x] Project/account scoping on web routes (`accountId`, editor `projectIds`)
- [x] `STUDIO_AUTH_DISABLED` for e2e/scripts only (not product dev workflow)
- [x] Auth e2e: refresh token flow (`studio-product-auth.e2e-spec.ts`)
- [x] Auth e2e: verify-email, forgot/reset password, logout (`studio-auth-flows.e2e-spec.ts`)
- [x] Auth e2e: Google OAuth URL (`studio-google-auth.e2e-spec.ts`; callback needs live Google)

### Studio tenant workspace (user admin & editor) — backend

_Scope: **one Studio account (tenant)**. Roles: **user admin** (account owner) and **user editor** (invited). **Out of scope here:** super-admin platform console (all tenants, global billing, impersonation)._

#### Subscription & billing (account-level)

- [x] Paddle integration: `studio_plans`, `studio_subscriptions` (per `accountId`), webhook, checkout
- [x] `GET /v1/web/billing/plans` (public), `GET /v1/web/billing/subscription` (summary + limits + usage)
- [x] `POST /v1/web/billing/paddle/checkout`, cancel/reactivate, transaction status
- [x] Super-admin plan CRUD: `GET/POST/PATCH/DELETE /v1/web/admin/plans` (dynamic catalog in MongoDB)
- [x] Enforce plan limits: `maxProjects`, `maxTeamSeats` on create project / invite editor
- [x] Account-level `monthlyChatQuota` enforced in `QuotaService` (aggregated per account)
- [x] Free trial: `GET /v1/web/billing/trial/eligibility`, `POST /v1/web/billing/trial/start` (internal, no card), Paddle checkout includes trial when eligible, expiry + conversion on payment
- [x] Scheduled downgrade (`POST .../subscription/downgrade`) + cancel pending change
- [x] Payment history (`GET /v1/web/billing/payments` from subscription history)
- [x] `billing.read` for subscription summary + payments; `billing.write` for checkout/cancel
- [x] `npm run seed:plans` — default free/starter/pro/premium catalog
- [x] Upgrade preview / immediate upgrade via Paddle (`POST .../subscription/upgrade/preview`, `POST .../upgrade`)
- [x] Customer billing portal (`POST /v1/web/billing/paddle/customer-portal`)

#### Projects

- [x] `GET/POST /v1/web/projects`, `GET /v1/web/projects/:id`, `PATCH .../settings`
- [x] List scoped to account; editors limited to `projectIds`
- [x] `DELETE /v1/web/projects/:id` (admin; cascade keys, knowledge, sessions, usage)
- [x] `PATCH /v1/web/projects/:id` — rename, `archived` flag
- [x] Account-level project list filters: `?archived=`, `?search=` by name
- [x] Default project on signup (`STUDIO_DEFAULT_PROJECT_ON_SIGNUP`, name via `STUDIO_DEFAULT_PROJECT_NAME`)
- [x] Project creation blocked when account at plan project limit (`assertCanCreateProject`)

#### Usage & analytics

- [x] Platform LLM via server env only (no tenant BYOK in v1)
- [x] Usage events on `POST /v1/sdk/chat` for operator analytics
- [x] **Super admin only:** `GET /v1/web/admin/usage/*` (projects, accounts, series, export, knowledge, sessions)
- [x] **Tenant admins:** `GET /v1/web/billing/quota` only (`billing.read`) — no usage dashboards
- [x] Quota enforcement: per-minute / per-day / per-month (plan `monthlyChatQuota` or env)
- [x] SDK `QUOTA_EXCEEDED` — end-user friendly message when limits hit
- [x] Email account admins at 80% / 90% / 100% monthly (`QUOTA_ALERT_PERCENTAGES`, SMTP optional)
- [x] Breakdowns: by route, error rate, p95 latency (`GET /v1/web/admin/usage/projects/:id/breakdown`, extended `usage_events`)

#### Team (workspace seat logins — not org/email invites)

- [x] `GET /v1/web/auth/members` — list seats + owner
- [x] `POST /v1/web/auth/members` — create editor seat (`username`, `password`, `projectIds`, optional `permissions`)
- [x] `PATCH /v1/web/auth/members/:userId` — update `username`, `projectIds`, `permissions`, `displayName`, reset `password` (editors only)
- [x] `DELETE /v1/web/auth/members/:userId` — remove editor seat (not owner; not self)
- [x] Seat login: `workspaceId` (account id) + `username` + `password`; owner login: `email` + `password`
- [x] Seat users cannot self-delete via OTP (`SEAT_SELF_DELETE_BLOCKED`); admin removes seat
- [ ] ~~Email invite / pending invites / multi-account~~ — **out of scope** (no org model)
- [x] Team audit log: `GET /v1/web/auth/members/audit` (seat created/updated/removed)

#### Settings

**Account (tenant)**

- [x] `GET/PATCH /v1/web/account` — org name, billing email, timezone, default locale
- [x] `GET/PATCH /v1/web/account/preferences` — notification toggles (usage alerts, billing, product email)
- [x] User profile via `GET /web/auth/me`; `PATCH /web/auth/me` for `displayName`, `picture`
- [x] Password via `change-password`; delete account via OTP (owner only)

**User (session)**

- [x] `change-password`, `logout` (token version bump), `refresh`
- [ ] Active sessions / devices list + revoke (optional)
- [ ] 2FA TOTP (optional, later)

**Project**

- [x] `PATCH /v1/web/projects/:id/settings` — system prompt, rules, tone (existing project settings)
- [x] `GET/PATCH /v1/web/projects/:id/sdk-config` — widget i18n, theme, UI flags, action allowlist
- [x] Project-level “danger zone”: `DELETE` project, `POST .../api-keys/rotate-all`

#### Already on `/v1/web/*` (supporting Studio screens)

- [x] API keys: issue + revoke (`POST/DELETE /web/api-keys`)
- [x] `GET /v1/web/projects/:projectId/api-keys` — list keys (prefix, name, `lastUsedAt`, no secret)
- [x] Actions CRUD, knowledge CRUD + upload, sdk-config, usage summary (see above)

#### Suggested additions (easy to forget)

- [x] **API keys list** (required for Studio keys screen)
- [x] **Project delete** + confirm dialog contract
- [x] **Project quota status** — `GET /web/projects/:id/usage/quota` (plan or env limits + monthly used)
- [x] **SDK config audit API** — `GET /v1/web/projects/:id/sdk-config/audit` (persisted in MongoDB)
- [x] **Chat/session browser** (read-only) — `GET .../sessions`, `GET .../sessions/:id/messages`
- [x] **Webhook outbound** — `preferences.quotaWebhookUrl` + POST on quota thresholds
- [ ] ~~**Multi-account membership**~~ — **won't do**; one seat = one workspace login
- [ ] **SSO/SAML** for enterprise accounts (Google OAuth only today)
- [x] **Rate limit headers** on `/v1/web/*` (`X-RateLimit-*`, `STUDIO_WEB_RATE_LIMIT_PER_MINUTE`)
- [x] Shared client: `billingApi` upgrade/portal, `platformApi`, `platformUsageAdminApi` breakdown
- [ ] E2e matrix with `STUDIO_AUTH_DISABLED=false` for new routes

### Studio platform operator (super admin) — later

_Not the current focus; keep role in JWT/model but build when tenant workspace is stable._

- [x] `/v1/web/platform/*` with `super_admin` guard
- [x] List/search accounts (`GET /v1/web/platform/accounts`)
- [ ] Impersonate tenant admin (audited)
- [ ] Global plan catalog, manual plan overrides, suspend account
- [ ] Platform-wide usage/revenue dashboards

### Studio frontend (`apps/studio`)

- [ ] Scaffold `apps/studio` (Vite/React)
- [ ] Auth screens (signup, login, verify, forgot password, Google callback)
- [ ] Shell nav: Projects, Usage, Team, Billing, Settings
- [ ] Projects list/create/settings; SDK config editor; knowledge upload UI
- [ ] Usage/analytics charts per project (depends on time-range APIs)
- [ ] Team management UI (depends on PATCH/DELETE members)
- [ ] Billing/subscription UI (depends on Stripe APIs)
- [ ] API keys screen (depends on list endpoint)
- [ ] Chat preview: embed SDK with live `sdk-config`
- [ ] Security UI: action allowlist vs disabled actions

### Studio-driven customization contract (hybrid: dashboard + code)

_Principle: dashboard controls presentation/policy; code keeps runtime logic/security boundaries. **Backend + SDK shipped** (curl/JSON today; Studio UI later)._

- [x] Define shared contract (`SdkProjectConfigData`) in `packages/shared/types` for dashboard-driven SDK config
- [x] Add shared DTOs for web API patch/get of SDK config (`UpdateSdkProjectConfigDto`)
- [x] Add backend endpoint(s): `GET /v1/web/projects/:id/sdk-config` and `PATCH /v1/web/projects/:id/sdk-config`
- [x] Persist SDK config per project (language, translations, theme tokens/mode, UI flags, action allowlist)
- [x] Validate payload schema server-side (class-validator DTOs, size limits)
- [x] Add config versioning field (`sdkConfigVersion`) for future migration safety
- [x] Add backend fallback behavior when config is missing/invalid (safe defaults)
- [x] Add backend enforcement for action allowlist in orchestration/request path (defense in depth)
- [x] Add audit log events for config mutations (`SdkConfigAudit`)
- [x] Expose runtime-safe subset for SDK consumption via `GET /v1/sdk/runtime` (`sdk` field)
- [x] Update SDK provider docs: merge order = local props override dashboard defaults override SDK defaults
- [x] Add test matrix: per-project isolation, invalid payload rejection, allowlist enforcement (e2e); fallback via unit sanitize tests

---

## Suggested build order

**Backend (done)** — infrastructure → auth → orchestrator → actions → RAG (text/url) → observability → billing.

**Backend (next)** — Excel/Word parsers, S3 storage, `/web/*` auth, remaining e2e (PDF citation, sdk-config matrix).

**SDK (current):**

1. Package foundation + `ActocoreProvider` + shared `configureApi`
2. **i18n** — locales, provider config, error-code mapping (no hardcoded UI strings)
3. **Theme tokens** — `tokens.css`, `ActocoreThemeConfig`, component styles via `var(--ac-*)` only
4. **Security** — action allowlist + handler registry on provider
5. Hooks (`runtime`, `session`, `chat`) + `ActocoreUiConfig` flags
6. Composable `ActoChat` UI (direct + Q&A + action pending)
7. `apps/sdk-playground` (locale/theme/security demos)
8. Publish + verify external install
9. Tests

**Then (Studio tenant backend):** broader auth e2e; optional project rename/archive; upgrade preview (Paddle v2).

**Then (Studio UI):** `apps/studio` against the above APIs.

**Later:** super-admin platform APIs; knowledge Excel/Word + S3.

---

## References

- [`apps/backend/README.md`](apps/backend/README.md) — API routes, knowledge matrix, env vars, curl examples
- [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md) — layers and request flow
- [`_docs/backend/OVERVIEW.md`](_docs/backend/OVERVIEW.md) — responsibilities
- [`_docs/studio/OVERVIEW.md`](_docs/studio/OVERVIEW.md) — Studio dashboard product
- [`_docs/studio/ARCHITECTURE.md`](_docs/studio/ARCHITECTURE.md) — `apps/studio` frontend structure
- [`_docs/studio/DESIGN.md`](_docs/studio/DESIGN.md) — brand colors & tokens
- [`_docs/PROJECT.md`](_docs/PROJECT.md) — product context
- [`_docs/RULES.md`](_docs/RULES.md) — implementation rules
