# ActoCore Roadmap

Implementation checklist for the ActoCore monorepo: **Core backend** (`apps/backend`), **shared contract** (`packages/shared`), **embeddable SDK** (`packages/sdk`), and **integration apps** for local testing.

Aligned with [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md), [`_docs/PROJECT.md`](_docs/PROJECT.md), and [`_docs/RULES.md`](_docs/RULES.md).

Update **Current focus** at the start of each work session.

---

## Current focus

**SDK package + example host:** ship an installable React SDK wired to Core via `@actocore/shared`, with **i18n for all UI copy**, **theme tokens (no hardcoded styles)**, **security allowlists**, and a **dashboard-ready config surface** so Studio can later drive language, theme, and chat UI — plus an example app for end-to-end testing outside the monorepo.

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
- [ ] Document required env/config: API key (Bearer), Core base URL (e.g. `http://localhost:3000`)

### 2. Internationalization (i18n) — all UI text

_Align with [`RULES.md`](_docs/RULES.md) (web uses i18next); SDK must be locale-ready for global hosts and future Studio language settings._

- [x] `react-i18next` + `i18next` in SDK; bundled locale files (e.g. `src/i18n/locales/en.json`, `fr.json`)
- [x] **Zero hardcoded strings** in components — use `useTranslation()` / `t('…')` keys only
- [x] Namespaced keys: `chat.*`, `intent.*`, `sources.*`, `action.*`, `errors.*` (map `ApiResponse.errorCode` → `errors.<code>`)
- [x] `ActocoreI18nConfig` on provider: `locale` (BCP‑47), optional `translations` deep-merge over bundled locales
- [x] `changeLanguage` when `locale` prop changes (host or dashboard-driven)
- [ ] Document how hosts override strings without forking components (pass `translations` on provider)
- [ ] Future (Studio): `GET/PATCH` project SDK settings returns `locale` + optional translation overrides — SDK reads same shape when API exists

### 3. Theming and styles — no hardcoded look & feel

_SDK ships a default look via tokens, not inline colors. Hosts and Studio customize variables, not component source._

- [x] Ship `styles/tokens.css` with `--ac-*` variables (font, spacing, radius, semantic colors, chat layout)
- [x] Root wrapper `[data-actocore]` + optional `data-actocore-theme="light|dark"`; support `theme.mode: 'system'` via `prefers-color-scheme`
- [x] `ActocoreThemeConfig`: `mode`, `tokens` (map to `--ac-<name>`), optional `className`
- [x] Components use **token-backed CSS** (class modules or a single `components.css` referencing `var(--ac-…)` only — no `#2563eb`-style literals in TSX)
- [x] Export `@ahmedrioueche/actocore-sdk/styles.css` (documentation pending: “import tokens once in host app”)
- [x] Optional slot/className props per subcomponent for layout tweaks without breaking token contract
- [ ] Future (Studio): dashboard publishes theme JSON → host passes `theme.tokens` to provider (or injects CSS on parent)

### 4. Security and action allowlist

_Defense in depth: Core validates schemas; SDK enforces what the **host app** may execute._

- [x] `ActocoreSecurityConfig` on provider: `allowedActionNames?: string[]`, `enforceActionAllowlist?: boolean`, `hostContext?: Record<string, unknown>` (forward when backend supports it)
- [x] Before invoking a host handler: check allowlist; show i18n `action.denied` when blocked (never silent no-op)
- [x] Handler registry keyed by action **name**; clear i18n when handler missing (`action.handlerMissing`)
- [x] Document host responsibility: register only actions they implement; align allowlist with actions enabled in Studio
- [ ] Future (Studio): project settings API returns allowed action names → provider `security.allowedActionNames`

### 5. UI feature flags (dashboard-ready)

- [x] `ActocoreUiConfig`: `showSources`, `showIntentBadge`, `composerMinRows` / `composerMaxRows`, etc.
- [x] Components read flags from context — no hardcoded “always show sources”
- [ ] Future (Studio): same flags stored per project and passed into `ActocoreProvider`

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
- [ ] `.npmrc` / auth notes for consumers (no secrets in repo)
- [x] Verify install in a **clean directory** outside the monorepo (`npm pack` or registry version)

### 10. Example host app (integration testing in monorepo)

_Separate app to prove “install SDK → talk to real Core” without publishing every change._

- [x] Add `apps/sdk-playground` (or `examples/sdk-host`) — Vite + React + TypeScript
- [x] Depends on local `packages/sdk` (workspace) or packed tarball; depends on published `actocore-shared`
- [x] `.env.example`: `VITE_ACTOCORE_API_URL`, `VITE_ACTOCORE_API_KEY`
- [ ] Seed script or docs: create project + API key via Studio/web routes, paste key into env
- [x] Demo page: `<ActocoreProvider>` with `locale`, `theme`, `security.allowedActionNames` + `<ActoChat />` + sample action handler
- [x] Playground toggles locale / theme to prove i18n and tokens (no hardcoded demo strings in SDK)
- [ ] Root `package.json` script: run playground + document “start backend + compose first”

### 11. Tests and quality

- [x] Unit tests: hooks (mock shared api), allowlist helper, i18n error mapping
- [x] Component tests: `ActoChat` send flow, locale switch, denied action UI (Vitest + RTL)
- [ ] Manual E2E checklist: backend up → playground → chat → Q&A sources → action pending → allowlist deny/allow → handler runs
- [ ] Optional: Playwright smoke against playground + local Core

---

## Studio (web dashboard)

_Control plane UI — not started in repo; listed for sequencing after SDK. Studio will eventually **drive SDK behavior** without customers redeploying._

- [ ] Scaffold `apps/studio` (or equivalent)
- [ ] Consume `@ahmedrioueche/actocore-shared` `api/` for projects, API keys, actions, knowledge
- [ ] Auth for `/web/*` routes (replace `@Public()` on control plane)
- [ ] **Project SDK settings** (future API): default `locale`, translation overrides, theme tokens / mode, `allowedActionNames`, UI flags (`showSources`, etc.) — same types as `ActocoreProvider` config
- [ ] **Chat preview** in Studio: embed SDK with settings from control plane (live preview of customized widget)
- [ ] **Security UI:** manage which actions are exposed to end users vs disabled in project; sync to SDK allowlist contract

### Studio-driven customization contract (hybrid: dashboard + code)

_Principle: dashboard controls presentation/policy; code keeps runtime logic/security boundaries._

- [ ] Define shared contract (`SdkProjectConfigData`) in `packages/shared/types` for dashboard-driven SDK config
- [ ] Add shared DTOs for web API patch/get of SDK config (`GetSdkConfigDto`, `UpdateSdkConfigDto`)
- [ ] Add backend endpoint(s): `GET /v1/web/projects/:id/sdk-config` and `PATCH /v1/web/projects/:id/sdk-config`
- [ ] Persist SDK config per project (language, translations, theme tokens/mode, UI flags, action allowlist)
- [ ] Validate payload schema server-side (strict key whitelist, type checks, size limits)
- [ ] Add config versioning field (`sdkConfigVersion`) for future migration safety
- [ ] Add backend fallback behavior when config is missing/invalid (safe defaults)
- [ ] Add backend enforcement for action allowlist in orchestration/request path (defense in depth)
- [ ] Add audit log events for config mutations (`actor`, `projectId`, changed keys, timestamp)
- [ ] Expose minimal runtime-safe subset for SDK consumption (never leak internal/admin-only fields)
- [ ] Update SDK provider docs: merge order = local props override dashboard defaults override SDK defaults
- [ ] Add test matrix: per-project isolation, invalid payload rejection, allowlist enforcement, fallback behavior

---

## Suggested build order

**Backend (done)** — infrastructure → auth → orchestrator → actions → RAG → observability → billing.

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

**Then (Studio):** control plane APIs for SDK settings → preview customized chat in dashboard.

**Then:** Studio web app, then production auth on web routes.

---

## References

- [`_docs/backend/ARCHITECTURE.md`](_docs/backend/ARCHITECTURE.md) — layers and request flow
- [`_docs/backend/OVERVIEW.md`](_docs/backend/OVERVIEW.md) — responsibilities
- [`_docs/PROJECT.md`](_docs/PROJECT.md) — product context
- [`_docs/RULES.md`](_docs/RULES.md) — implementation rules
