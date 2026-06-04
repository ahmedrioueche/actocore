# SDK Playground

Local host app to validate `@ahmedrioueche/actocore-sdk` against a real ActoCore backend.

| Doc | Purpose |
|-----|---------|
| [MANUAL_E2E.md](./MANUAL_E2E.md) | Full manual test checklist |
| [packages/sdk/DEV.md](../../packages/sdk/DEV.md) | SDK + playground dev workflow |
| [apps/backend/DEV.md](../backend/DEV.md) | Backend, env, auth, tests |

## Quick start (from repo root)

```powershell
docker compose -f compose.yml up -d
npm run dev:backend
```

New terminal:

```powershell
cd apps/sdk-playground
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open http://localhost:5173. `npm run setup` creates a project + API key (writes `.env`) and seeds actions + knowledge.

## Run (playground only)

```bash
cd apps/sdk-playground
cp .env.example .env
npm install
npm run setup
npm run dev
```

Backend must be running (`apps/backend`) with MongoDB connected.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run setup` | Project/key (if needed) + `seed:actions` + `seed:knowledge` |
| `npm run seed:actions` | Register `add_user`, `list_users`, … on Core |
| `npm run seed:knowledge` | Ingest demo FAQ for Q&A |
| `npm run config:fr` | PATCH sdk-config for French remote-config test |
| `npm run config:allowlist` | PATCH sdk-config (server allowlist: `list_users` only) |
| `npm run config:reset` | PATCH sdk-config back to defaults |

## Test Knowledge (Q&A)

1. Run `npm run seed:knowledge`.
2. Open the playground chat and ask questions that start with **What**, **How**, or **Tell me** (so intent is classified as Knowledge).
3. Enable **Show sources** and **Show intent badge** in the playground sidebar.

Example prompts:

- `What is ActoCore?`
- `How do I add a user in the playground?`

## Add your own documents

### Text or Markdown

```bash
npm run seed:knowledge -- --file ./path/to/faq.md
```

The file is ingested as a `text` knowledge source (title = filename without extension).

### Upload files (PDF, text, markdown)

Backend multipart API:

```bash
npm run seed:knowledge -- --upload ./path/to/manual.pdf
```

Also accepts `.txt` and `.md`. PDF text extraction runs on Core (`pdf-parse`); scanned PDFs without text are rejected.

Direct API:

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge/upload?title=My%20doc" \
  -F "file=@./manual.pdf"
```

### Public web pages (HTML only)

You can ingest a URL (backend fetches HTML and strips tags):

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"url\",\"title\":\"Docs page\",\"url\":\"https://example.com/docs\"}"
```

Direct PDF URLs work when the response is a PDF (`Content-Type` or magic bytes); HTML-only pages are stripped to text.

## Voice and remote SDK config

Sidebar toggles:

- **Voice input / output** — mic in the composer and read-aloud on assistant messages. Server STT needs `VOICE_STT_PROVIDER=openai` on Core; otherwise use browser dictation (`inputMode: 'auto'`).
- **Load SDK config from backend** — enables `loadRemoteConfig` on the provider. Patch settings first:

```bash
curl -X PATCH "http://localhost:3000/v1/web/projects/PROJECT_ID/sdk-config" \
  -H "Content-Type: application/json" \
  -d '{"ui":{"showIntentBadge":true},"i18n":{"locale":"fr"}}'
```

See [`apps/backend/README.md`](../backend/README.md) for API details.

## What this app demonstrates

- Locale switching (`en` / `fr`)
- Theme switching (`light` / `dark` / `system`)
- Action allowlist enforcement
- UI feature flags (`showSources`, `showIntentBadge`)
- Voice input/output and optional dashboard-driven config (`loadRemoteConfig`)
- Demo users panel with action handlers
