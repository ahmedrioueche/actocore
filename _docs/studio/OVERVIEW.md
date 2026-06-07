# ActoCore Studio (Web Dashboard)

Studio is the **tenant control plane** — the SaaS dashboard developers use to configure ActoCore for their applications. It is implemented as **`apps/studio`** (Vite + React + TypeScript).

**Local development:** [`apps/studio/README.md`](../../apps/studio/README.md) · **Frontend architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md) · **Backend API / RBAC:** [`apps/backend/STUDIO_BACKEND.md`](../../apps/backend/STUDIO_BACKEND.md)

---

## Purpose

Studio lets account owners and their team:

- Create and manage **projects**
- Issue and rotate **API keys** (for the embeddable SDK — not for Studio login)
- Define **actions**, upload **knowledge**, and edit **SDK config** (locale, theme, UI flags, allowlist)
- View **usage** and **sessions** (where permitted)
- Manage **billing** and **team seats**
- View workspace **usage** and change **subscription** plans (checkout, upgrade, cancel)
- **Plans** (Free, Starter, Pro) are seeded to Mongo and editable by super admin via `/v1/web/admin/plans` (`features`, pricing, limits)
- Configure **account** settings and preferences

Product context: [`_docs/PROJECT.md`](../PROJECT.md) § Studio.

---

## Constraints

Studio is a **configuration and observability UI**. It must **not**:

- Run AI orchestration or chat inference (that is Core + SDK)
- Call `/v1/sdk/*` with project API keys as the logged-in Studio user
- Duplicate API DTOs or HTTP clients outside `packages/shared`

Studio users authenticate with **JWT** on **`/v1/web/*`**. End-user apps use **project API keys** on **`/v1/sdk/*`**. Those identities must stay separate.

---

## Roles (summary)

| Role | Scope |
|------|--------|
| **Super admin** | Platform operator — all tenants (`/v1/web/platform/*`) |
| **User admin** | Account creator — billing, team, all projects in the workspace |
| **User editor** | Seat login (workspace id + username + password) — assigned projects only |

Default editor permissions, API key policy, and route guards are documented in [`STUDIO_BACKEND.md`](../../apps/backend/STUDIO_BACKEND.md).

---

## Implementation status

| Area | Status |
|------|--------|
| `/v1/web/*` backend | Shipped (auth, RBAC, projects, keys, knowledge, sdk-config, usage, billing) |
| `packages/shared` api + types | Shipped for web routes (global types only) |
| `apps/studio` UI | In progress — projects, actions, SDK config, **subscription + billing** pages; TanStack Router/Query/Table |

---

## Related documentation

| Document | Contents |
|----------|----------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | App layers, folders, data flow, testing |
| [`DESIGN.md`](./DESIGN.md) | Brand colors, CSS tokens, Tailwind usage |
| [`_docs/RULES.md`](../RULES.md) | Coding standards (i18n, Tailwind, shared api, modals) |
| [`apps/backend/STUDIO_BACKEND.md`](../../apps/backend/STUDIO_BACKEND.md) | Auth flow, permissions, route tables |
| [`apps/backend/README.md`](../../apps/backend/README.md) | HTTP reference, env vars, curl |
| [`ROADMAP.md`](../../ROADMAP.md) | Studio frontend checklist |
