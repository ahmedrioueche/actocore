# ActoCore Studio — Frontend Architecture

This document describes how the Studio web app (`apps/studio`) is structured and how it integrates with Core and `@actocore/shared`.

**Product overview:** [`OVERVIEW.md`](./OVERVIEW.md) · **Backend contract:** [`apps/backend/STUDIO_BACKEND.md`](../../apps/backend/STUDIO_BACKEND.md) · **Dev commands:** [`apps/studio/README.md`](../../apps/studio/README.md)

---

## High-level flow

```text
Browser (Studio)
      ↓
TanStack Router (routes, guards, URL state)
      ↓
pages/ + components/
      ↓
hooks/  →  TanStack Query  →  @actocore/shared api/*  (Bearer JWT)
      ↓
Core  /v1/web/*
```

Studio never calls `fetch` / `axios` directly. All Core HTTP lives in `packages/shared/src/api/`.

---

## Technology stack

| Concern | Choice |
|---------|--------|
| Build | Vite |
| UI | React 19 + TypeScript (strict) |
| Styling | Tailwind CSS — brand tokens in [`src/styles/tokens.css`](../../apps/studio/src/styles/tokens.css) · [`DESIGN.md`](./DESIGN.md) |
| i18n | i18next — all UI strings in `src/i18n/locales/en.json` |
| **Routing** | **TanStack Router** (`src/routes/`) |
| **Server cache** | **TanStack Query** (`src/lib/query-client.ts`, `src/lib/query-keys.ts`) |
| **Tables / pagination UI** | **TanStack Table** (`components/ui/DataTable.tsx`, `useStudioPagination`) |
| Client UI state | Zustand (modals, ephemeral UI — not server data) |

See [`_docs/RULES.md`](../RULES.md) for component, modal, and accessibility rules.

---

## Source layout (`apps/studio/src`)

```text
src/
  types/                  Studio-local types only (see below)
  lib/                    query-client, query-keys, parse-api-response
  providers/              QueryClientProvider + RouterProvider
  routes/                 TanStack Router tree
  hooks/                  useQuery/useMutation wrappers + useStudioPagination
  components/
    layout/               AppShell, protected layouts
    ui/                   Loading, Error, DataTable, PageHeader, …
  pages/                  Route target components (thin — logic in hooks)
  …
```

Feature-specific presentational components live under `components/<feature>/` per RULES.

---

## Types: global vs local

| Scope | Location | Examples |
|-------|----------|----------|
| **Global (API contract)** | `packages/shared/src/types/`, `dtos/` | `ProjectData`, `ApiResponse`, `StudioMemberData` |
| **Studio local (UI only)** | `apps/studio/src/types/` | `StudioListQueryParams`, table pagination, modal props, form state, row view-models |

Rules:

- Import API shapes from `@actocore/shared` — **never redefine** them in Studio.
- If the UI needs a different shape, define a **view-model** in `src/types/` and map in a hook.
- **Never** put request/response DTOs in `apps/studio/src/types/`.

---

## Data fetching pattern

1. Add or reuse `api` + types in `packages/shared`.
2. Create a hook, e.g. `useProjectsList`, with:

```typescript
useQuery({
  queryKey: queryKeys.projects.list(params),
  queryFn: async () => parseApiResponse(await projectsApi.list(params)),
});
```

3. Lists: `useStudioPagination` + `DataTable` with `manualPagination` when the API returns total counts.
4. Invalidate related `queryKeys` after `useMutation` success.

---

## Routing

- Define routes in `src/routes/` (TanStack Router).
- Auth routes outside the app shell; shell routes under a layout route with permission checks.
- Do **not** use `react-router-dom` in Studio.
- Per-project landing: `/projects/:projectId` (**Overview**). Integration guide: `/projects/:projectId/docs`.
- **Super admin** (`super_admin`) is redirected from tenant workspace routes (`/projects`, `/team`, …) to **`/admin`** — platform operators use the admin console, not the tenant dashboard.

---

## Authentication (UI)

- Access token stored after login; attach via shared api client configuration.
- `GET /v1/web/auth/me` cached with `queryKeys.auth.me()`.
- Role and `permissions[]` drive nav and actions (see STUDIO_BACKEND).

Editors use **workspace id + username + password**. Do not use project API keys in Studio.

---

## Modals and errors

- Modals: Zustand modal store + lazy `modals/` registry.
- Errors: `getMessage(errorCode)` + `ShowStatusToast`; Query `meta` via `StudioQueryMeta` when needed.
- Loading / error / empty: `components/ui` primitives.

---

## Planned navigation (ROADMAP)

Shell: **Projects**, **Usage**, **Team**, **Billing**, **Settings**. Auth routes: login, signup, verify, forgot password, OAuth callback.

---

## Testing

| Layer | Approach |
|-------|----------|
| Core `/v1/web/*` | Backend e2e (`studio-*.e2e-spec.ts`) |
| Studio hooks/utils | Vitest — pagination helpers, `parseApiResponse`, permission helpers |
| Full UI | `MANUAL_E2E.md` (future) |

---

## Documentation maintenance

Update `_docs/studio/`, `STUDIO_BACKEND.md` (API changes), `ROADMAP.md` (shipped items), `apps/studio/README.md` (run/env only).

---

## Related

- [`OVERVIEW.md`](./OVERVIEW.md)
- [`_docs/RULES.md`](../RULES.md)
- [`apps/backend/STUDIO_BACKEND.md`](../../apps/backend/STUDIO_BACKEND.md)
- [`packages/shared/src/types/`](../../packages/shared/src/types/)
- [`apps/studio/src/types/`](../../apps/studio/src/types/)
