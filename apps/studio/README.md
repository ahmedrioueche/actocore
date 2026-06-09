# ActoCore Studio (`apps/studio`)

Tenant web dashboard (control plane). Full documentation: **[`_docs/studio/OVERVIEW.md`](../../_docs/studio/OVERVIEW.md)** and **[`_docs/studio/ARCHITECTURE.md`](../../_docs/studio/ARCHITECTURE.md)**.

Backend API and RBAC: [`apps/backend/STUDIO_BACKEND.md`](../backend/STUDIO_BACKEND.md).

**Types:** API types in `packages/shared` only; Studio UI types in `src/types/`. **Data UI:** TanStack Router, Query, and Table (see ARCHITECTURE). **Brand colors:** [`_docs/studio/DESIGN.md`](../../_docs/studio/DESIGN.md) · tokens in `src/styles/tokens.css`.

## Setup

```bash
cd apps/studio
npm install
cp .env.example .env   # set VITE_ACTOCORE_API_URL
# With backend running — add your Studio login to .env first, then:
# STUDIO_SETUP_EMAIL=you@company.com
# STUDIO_SETUP_PASSWORD=...
npm run setup:assistant   # writes VITE_ACTOCORE_API_KEY — restart `npm run dev` after
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Vitest unit tests (auth utils, guards, hooks) |

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_ACTOCORE_API_URL` | Core base URL (e.g. `http://localhost:3000`) |
| `VITE_ACTOCORE_API_KEY` | Platform assistant embed key (from `npm run setup:assistant`; optional — widget hidden if unset) |
| `VITE_ACTOCORE_ASSISTANT_PROJECT_ID` | Platform assistant project id (set by setup script) |
