# Backend — developer guide

Day-to-day notes for working on `apps/backend` in the monorepo. API reference and route tables stay in [README.md](./README.md).

---

## Daily workflow

From repo root (PowerShell):

```powershell
docker compose -f compose.yml up -d
npm run dev:backend
```

Another terminal for the playground:

```powershell
npm run dev:playground
# first time only:
npm run playground:setup
```

| Check         | URL / command                            |
| ------------- | ---------------------------------------- |
| API up        | `GET http://localhost:3000/health`       |
| DB ready      | `GET http://localhost:3000/health/ready` |
| Versioned API | `http://localhost:3000/v1/...`           |

After changing Nest providers, guards, or env validation: **restart** `start:dev` (watch reloads TS, not always enough for config module).

---

## Environment (`.env`)

Copy [`.env.example`](./.env.example) → `.env`. Minimum for local chat:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=actocore_dev
REDIS_URL=redis://localhost:6379
LLM_PROVIDER=stub
```

Use a real model when testing answers, actions, or RAG quality:

```env
LLM_PROVIDER=google
GEMINI_API_KEY=...
GOOGLE_MODEL=gemini-2.5-flash
```

| Variable                                         | When you need it                                      |
| ------------------------------------------------ | ----------------------------------------------------- |
| `EMBEDDING_PROVIDER=openai` + `OPENAI_API_KEY`   | Real vector search (not stub embeddings)              |
| `VOICE_STT_PROVIDER=openai` + `OPENAI_API_KEY`   | Server microphone transcription                       |
| `QUOTA_ENFORCE=true`                             | Test rate limits locally                              |
| `KNOWLEDGE_STORAGE_PATH`                         | Where uploaded files land (default `.data/knowledge`) |
| `STUDIO_AUTH_REQUIRED=true` + `STUDIO_DEV_TOKEN` | Lock down `/v1/web/*` like production                 |
| `API_KEY_PEPPER`                                 | Required in `NODE_ENV=production`                     |

E2e tests set their own env in `test/helpers/e2e-env.ts` (`STUDIO_AUTH_REQUIRED=false`, `LLM_PROVIDER=stub`, in-memory Mongo).

---

## Two auth planes (do not mix them up)

```text
Studio web app (signup/login, RBAC)  →  session / JWT  →  /v1/web/*
End-user app (embeddable SDK)      →  project API key  →  /v1/sdk/*
```

| Task                                               | Auth                             |
| -------------------------------------------------- | -------------------------------- |
| Create project, upload knowledge, PATCH sdk-config | Studio user on `/web/*` (target) |
| Chat, sessions, runtime, voice transcribe          | SDK key on `/sdk/*`              |

**Studio auth is live:** signup/login + JWT + RBAC on `/v1/web/*`. See [STUDIO_BACKEND.md](./STUDIO_BACKEND.md).

For **playground seed scripts** without logging in, add to `apps/backend/.env`:

```env
STUDIO_AUTH_DISABLED=true
```

Or call `POST /v1/web/auth/signup` then use `accessToken` on web routes (playground will get login helper later).

**Billing (Paddle):** seed plan catalog, then set Paddle price IDs on paid plans (super-admin API or env on seed):

```powershell
cd apps/backend
npm run seed:plans
# optional: PADDLE_PRICE_STARTER_MONTHLY=pri_... npm run seed:plans
```

Configure `PADDLE_API_KEY`, `PADDLE_URL`, `PADDLE_WEBHOOK_SECRET` in `.env`. Super admin (`role: super_admin` on a membership) manages plans at `GET/POST /v1/web/admin/plans`.

Create a project + SDK key without the playground:

```powershell
$base = "http://localhost:3000/v1"
$headers = @{ "Content-Type" = "application/json" }
if ($env:STUDIO_DEV_TOKEN) { $headers["Authorization"] = "Bearer $($env:STUDIO_DEV_TOKEN)" }

$p = Invoke-RestMethod -Method Post -Uri "$base/web/projects" -Headers $headers -Body '{"name":"Dev"}'
$pid = $p.data.id
$k = Invoke-RestMethod -Method Post -Uri "$base/web/api-keys" -Headers $headers -Body (@{ projectId = $pid; name = "dev" } | ConvertTo-Json)
$k.data.key   # paste into playground VITE_ACTOCORE_API_KEY
```

---

## Monorepo: `packages/shared`

Backend depends on shared via **`file:../../packages/shared`** (not only npm).

When you change DTOs, types, or `packages/shared/src/api/*`:

```powershell
cd packages/shared
npm run build
cd ../../apps/backend
# restart start:dev
```

Rule from [`_docs/RULES.md`](../../_docs/RULES.md): define types in shared first; backend imports `@ahmedrioueche/actocore-shared` only.

Optional version sync across `package.json` files:

```powershell
python watch_package.py --watch packages/shared/package.json --dependency @ahmedrioueche/actocore-shared --targets apps/backend/package.json packages/sdk/package.json
```

---

## Tests

```powershell
cd apps/backend
npm run test          # unit (Jest)
npm run test:e2e      # HTTP e2e (MongoMemoryServer; can be slow / flaky on first start)
```

Useful focused runs:

```powershell
npm run test:e2e -- --testPathPatterns=studio-auth
npm run test:e2e -- --testPathPatterns=knowledge
npm run test:e2e -- --testPathPatterns=sdk-config
```

If e2e fails with “MongoMemoryServer … 10000ms”, rerun once or close other Mongo processes.

---

## Where code lives

| Area                   | Path                                   |
| ---------------------- | -------------------------------------- |
| SDK HTTP entry         | `src/entry/sdk/*`                      |
| Chat orchestration     | `src/orchestrator/`                    |
| Actions (NL + pending) | `src/actions/`                         |
| Knowledge / RAG        | `src/knowledge/`                       |
| Project + sdk-config   | `src/projects/`                        |
| Studio web guard       | `src/auth/guards/studio-auth.guard.ts` |
| Config / env           | `src/config/`                          |
| E2e seeds              | `test/helpers/e2e-seed.ts`             |

Studio control-plane plan: [STUDIO_BACKEND.md](./STUDIO_BACKEND.md).

---

## Debugging tips

| Symptom                            | Likely cause                                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| 401 on `/web/*`                    | `STUDIO_AUTH_REQUIRED=true` but missing `STUDIO_DEV_TOKEN` header                                   |
| 401 on `/sdk/*`                    | Wrong or revoked API key                                                                            |
| Q&A with no sources                | No `ready` knowledge, or message not classified as Q&A                                              |
| Action shows Reply but no Run card | Multi-turn clarify flow — see action follow-up in orchestrator; restart backend after backend fixes |
| PDF upload `error`                 | Scanned PDF / no extractable text                                                                   |
| Quota 429 in dev                   | Set `QUOTA_ENFORCE=false` in `.env`                                                                 |

Enable stub LLM for predictable, fast responses:

```env
LLM_PROVIDER=stub
```

---

## Integration with SDK

Use [`apps/sdk-playground`](../sdk-playground/README.md) as the host app:

- `npm run setup` — project, key, actions, knowledge
- `npm run config:fr` / `config:allowlist` — remote sdk-config
- [MANUAL_E2E.md](../sdk-playground/MANUAL_E2E.md) — full checklist

SDK dev workflow: [`packages/sdk/DEV.md`](../../packages/sdk/DEV.md).

---

## Related

- [README.md](./README.md) — routes, knowledge matrix, curl
- [STUDIO_BACKEND.md](./STUDIO_BACKEND.md) — Studio `/web/*` roadmap
- [`_docs/backend/ARCHITECTURE.md`](../../_docs/backend/ARCHITECTURE.md)
- [ROADMAP.md](../../ROADMAP.md)
