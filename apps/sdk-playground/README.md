# SDK Playground

Local host app to validate `@ahmedrioueche/actocore-sdk` against a real ActoCore backend.

## Run

```bash
cd apps/sdk-playground
cp .env.example .env
npm install
npm run dev
```

Set `VITE_ACTOCORE_API_KEY` with a valid project API key (same project as seeded data).

Backend must be running (`apps/backend`) with MongoDB connected.

## Seed demo data

```bash
# In-app actions (add_user, list_users, …)
npm run seed:actions

# Knowledge / Q&A (RAG chunks for the playground project)
npm run seed:knowledge
```

Both scripts resolve the project from `VITE_ACTOCORE_API_KEY` in `.env`.

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

### PDF

The HTTP API does not accept raw PDF uploads yet (`type: "document"` is reserved but not implemented). For now, extract text and ingest as `text`:

**Option A — seed script (recommended for local dev)**

```bash
npm install   # includes optional devDependency pdf-parse
npm run seed:knowledge -- --pdf ./path/to/manual.pdf
```

**Option B — extract text yourself, then use `--file`**

```bash
pdftotext manual.pdf manual.txt
npm run seed:knowledge -- --file ./manual.txt
```

**Option C — paste via API**

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"text\",\"title\":\"My doc\",\"content\":\"...paste extracted text...\"}"
```

### Public web pages (HTML only)

You can ingest a URL (backend fetches HTML and strips tags):

```bash
curl -X POST "http://localhost:3000/v1/web/projects/PROJECT_ID/knowledge" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"url\",\"title\":\"Docs page\",\"url\":\"https://example.com/docs\"}"
```

Direct PDF URLs will not work until document/PDF parsing is added to the backend.

## What this app demonstrates

- Locale switching (`en` / `fr`)
- Theme switching (`light` / `dark` / `system`)
- Action allowlist enforcement
- UI feature flags (`showSources`, `showIntentBadge`)
- Demo users panel with action handlers
