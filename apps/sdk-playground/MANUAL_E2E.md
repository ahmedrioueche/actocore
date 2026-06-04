# SDK Playground — Manual E2E checklist

Use this to validate `@ahmedrioueche/actocore-sdk` against a **local** ActoCore backend before release or customer handoff.

Mark each row **Pass / Fail / Skip** and note issues in the Fail column.

---

## Prerequisites

| Requirement | Check |
|-------------|--------|
| Node 20+ | |
| Docker (MongoDB + Redis) | |
| Backend `.env` from `apps/backend/.env.example` | |
| Playground `.env` with API key (setup script writes it) | |

---

## 1. Start the stack

From repo root (PowerShell uses `;` between commands):

```powershell
# Terminal A — infrastructure
docker compose -f compose.yml up -d

# Terminal B — API
cd apps/backend
cp .env.example .env   # first time only
npm install
npm run start:dev
```

Wait until backend logs show listening on port **3000**. Quick check:

```powershell
curl http://localhost:3000/health
```

```powershell
# Terminal C — playground setup + UI
cd apps/sdk-playground
cp .env.example .env   # first time only
npm install
npm run setup          # project + API key + actions + knowledge
npm run dev
```

Open **http://localhost:5173** (Vite default). The yellow “Missing API key” banner should be **gone** after `npm run setup`.

### Script reference

| Script | What it does |
|--------|----------------|
| `npm run setup` | `seed:actions` + `seed:knowledge` (creates project/key if `.env` has no key) |
| `npm run seed:actions` | Register playground actions on Core |
| `npm run seed:knowledge` | Ingest demo FAQ text for Q&A |
| `npm run config:fr` | PATCH sdk-config (French + UI flags) for remote-config test |
| `npm run config:allowlist` | PATCH sdk-config (`list_users` only on server) |
| `npm run config:reset` | PATCH sdk-config back to English defaults |

From repo root (optional):

```powershell
npm run dev:infra
npm run dev:backend
npm run playground:setup
npm run dev:playground
```

---

## 2. Baseline UI

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.1 | Page loads, chat widget visible | Launcher or embedded chat opens | |
| 2.2 | **Locale → Français** | Header/placeholder switch to French | |
| 2.3 | **Theme → Dark** | Widget uses dark tokens | |
| 2.4 | **Show sources** + **Show intent badge** on | Checkboxes stay enabled | |

---

## 3. Direct chat (LLM stub)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.1 | Send: `Hello` | Assistant reply; intent badge **direct** (if shown) | |
| 3.2 | Send: `Thanks` (follow-up) | Same session continues; no error banner | |

---

## 4. Knowledge / Q&A (RAG)

Requires `npm run seed:knowledge` (included in `npm run setup`).

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.1 | Ensure **Show sources** is on | | |
| 4.2 | Send: `What is ActoCore?` | Intent **qa**; answer mentions integration/SDK; **sources** list with title e.g. “ActoCore overview” | |
| 4.3 | Send: `How do I add a user in the playground?` | Q&A answer references demo users / add_user | |

If Q&A has no sources: re-run `npm run seed:knowledge` and confirm backend Mongo is the same DB as in backend `.env`.

---

## 5. Actions — happy path

Default allowlist: `add_user,delete_user,update_user,list_users`.

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.1 | Send: `Run list_users` | Intent **action**; pending card for **list_users**; Run works; console lists users | |
| 5.2 | Send: `Run add_user {"email":"e2e@test.com","name":"E2E User"}` | Pending **add_user**; after Run, user appears in **Demo users** panel | |
| 5.3 | Send: `Run delete_user {"email":"e2e@test.com"}` | User removed from panel | |

Natural language also works, e.g. `Show me all users` → **list_users**, `delte bob@demo.com` → **delete_user** pending card (email in same message).

**Multi-turn delete (supported):** `delete` → `bob@demo.com` → should show **Action** + Run card (not Reply parroting “Ready to run”). Optional: `ok go` after email should also surface the card.

---

## 6. SDK allowlist (client-side)

Uses the sidebar **Allowed actions** field (comma-separated), not server sdk-config.

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.1 | Set allowlist to `list_users` only | | |
| 6.2 | Send: `Run add_user {"email":"x@y.com","name":"X"}` | Action **denied** in UI (i18n); handler does **not** run | |
| 6.3 | Send: `Run list_users` | Still allowed; pending card works | |
| 6.4 | Restore full allowlist: `add_user,delete_user,update_user,list_users` | | |

---

## 7. Server allowlist (`sdk-config`)

Tests Core filtering + optional `loadRemoteConfig`.

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.1 | Run: `npm run config:allowlist` | Script prints OK + sdkConfigVersion | |
| 7.2 | Enable **Load SDK config from backend**; reload page | | |
| 7.3 | Send: `Run deploy` or `Run add_user {"email":"a@b.com"}` | No pending card for blocked action; assistant explains no match / not available | |
| 7.4 | Send: `Show me all users` | **list_users** pending still works | |
| 7.5 | Run: `npm run config:reset`; toggle remote config off | Back to normal English + full actions | |

---

## 8. Remote SDK config (dashboard merge)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.1 | Run: `npm run config:fr` | | |
| 8.2 | Enable **Load SDK config from backend**; reload | Widget copy tends French from server (local locale may still override if set to `fr` in sidebar) | |
| 8.3 | Set sidebar locale **English**, keep remote on | Merge rule: **local props win** — verify behavior matches README | |
| 8.4 | `npm run config:reset`; reload | | |

---

## 9. Voice (optional)

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 9.1 | **Voice input** on; use mic, dictate, click **Send** | Text appears in composer; message sends | |
| 9.2 | **Voice output** on; after assistant reply | Read-aloud control works (browser TTS) | |

Server STT (`inputMode: server`) needs `VOICE_STT_PROVIDER=openai` + `OPENAI_API_KEY` in `apps/backend/.env`. Default **auto** uses browser dictation when available.

---

## 10. Published npm package (optional)

Validates what customers install from npm.

```powershell
cd apps/sdk-install-check
npm init -y
npm install @ahmedrioueche/actocore-sdk@latest
npm ls @ahmedrioueche/actocore-sdk @ahmedrioueche/actocore-shared
```

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 10.1 | Install succeeds without project `.npmrc` | shared is transitive dependency | |
| 10.2 | Tiny React app imports SDK + `styles.css` | Build/dev starts (see `sdk-install-check`) | |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error in browser | Add playground origin to `CORS_SDK_ORIGINS` in backend `.env` (`http://localhost:5173`) |
| Missing API key banner | `npm run setup` with backend running |
| Q&A never returns sources | `npm run seed:knowledge`; ask What/How/Tell me |
| Actions never pending | `npm run seed:actions`; use `Run <action_name> …` |
| 502 on chat | Check Mongo/Redis; `LLM_PROVIDER=stub` in backend `.env` |
| Remote config no effect | Enable checkbox **and** reload; run `npm run config:fr` first |

---

## Sign-off

| Date | Tester | SDK version | Shared version | Notes |
|------|--------|-------------|----------------|-------|
| | | | | |

When all critical rows (§3–§7) pass, update `ROADMAP.md` SDK §11 manual E2E checkbox.
