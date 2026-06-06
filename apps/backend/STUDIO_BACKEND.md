# Studio backend (control plane)

## What Studio actually is

**Studio** = the full **web SaaS app** (`apps/studio`, not built yet):

- Signup and login (email/password or SSO later)
- **RBAC** with at least:
  - **Super admin** — platform-wide (all tenants, billing, global settings)
  - **User admin** — manage projects, API keys, actions, knowledge, SDK config, team
  - **User editor** — limited write (e.g. knowledge, prompts) without destructive/admin actions

Studio talks to Core on **`/v1/web/*`**. End-user apps use **`/v1/sdk/*`** with **project API keys** only. Those are different identities and must not be mixed.

---

## What exists today

| Piece | Status |
|--------|--------|
| `/v1/web/*` CRUD APIs | Projects, keys, actions, knowledge, sdk-config, usage |
| **Auth** | Signup (email verify), login, refresh, logout, forgot/reset password, change password, Google OAuth |
| **Routes** | See `StudioAuthController` — prefix `/v1/web/auth` |
| **Team** | `GET/POST/PATCH/DELETE /web/auth/members` — workspace seat logins (username per workspace) |
| **Account** | `GET/PATCH /web/account`, `GET/PATCH /web/account/preferences` |
| **RBAC** | Permission checks on web routes; editor defaults = knowledge, not API keys |
| **`STUDIO_AUTH_DISABLED=true`** | Local/scripts only — skips JWT (not for production) |

Removed: static `STUDIO_DEV_TOKEN` bridge.

---

## Auth flow (implemented)

```text
Signup / Login  →  JWT (Authorization: Bearer)
                →  StudioAuthGuard + StudioPermissionsGuard
                →  project scoping (accountId + editor projectIds)
SDK embed       →  project API key (unchanged)
```

### API surface

| Area | Routes |
|------|--------|
| Auth | signup, login (email or workspaceId+username), refresh, `GET/PATCH /web/auth/me`, Google OAuth |
| Team | `GET/POST/PATCH/DELETE /web/auth/members` (user admin; seat usernames) |
| Account | `GET/PATCH /web/account`, preferences |
| Onboarding | `GET/PATCH /web/onboarding` — post-signup wizard state (user admin; editors skip) |
| Projects | list (`?archived=`, `?search=`), create, `PATCH` rename/archive, `DELETE`; settings + sdk-config |
| Projects | `GET .../usage/quota`; `GET .../sessions`, `GET .../sessions/:id/messages` (debug browser) |
| API keys | issue/revoke; `GET .../api-keys`; `POST .../api-keys/rotate-all` |
| Team audit | `GET /web/auth/members/audit` |
| SDK config audit | `GET /web/projects/:id/sdk-config/audit` |
| Billing v2 | `POST .../subscription/upgrade/preview`, `POST .../upgrade`, `POST .../paddle/customer-portal` |
| Platform | `GET /web/platform/accounts` (super_admin) |
| Usage (ops) | `GET /web/admin/usage/projects/:id/breakdown` |
| API keys, actions, knowledge, sdk-config, usage | Same paths + permission metadata |

### Roles

| Role | Who |
|------|-----|
| **Super admin** | ActoCore platform operator (internal) |
| **User admin** | **Account creator** — first signup for that tenant/org; owns billing, team, and all projects unless delegated |
| **User editor** | Workspace **seat** created by user admin (`username` + `password`); works on assigned project(s) only |

User admin **creates editor seats** in Studio: pick a username (unique in that workspace), set password, assign **one or more projects**, and optionally override **permissions**. Editors sign in with **workspace id** (account id from `/auth/me`) + **username** + password — not email. No invite emails or multi-workspace identity.

### Can user editor touch API keys?

**Default: no.** API keys are secrets for the embeddable SDK — only **user admin** (and super admin) may issue, list, and revoke keys.

Editors may be granted extra permissions explicitly (see flags), but **`api_keys` is off by default** and should stay off unless the admin deliberately enables it.

### Default permissions — user editor

Applied automatically when admin creates an editor (admin can toggle per user):

| Permission | Default | Notes |
|------------|---------|--------|
| `project.read` | ✅ | See assigned project(s) |
| `knowledge.read` | ✅ | List / view sources |
| `knowledge.write` | ✅ | Upload, create text/URL, edit metadata |
| `knowledge.delete` | ✅ | Remove sources |
| `sdk_config.read` | ✅ | View widget settings (locale, theme, UI flags) |
| `sdk_config.write` | ❌ | PATCH sdk-config (copy, theme, allowlist) — admin only by default |
| `actions.read` | ✅ | See registered actions (understand what SDK can run) |
| `actions.write` | ❌ | Create/update/delete actions |
| `api_keys.read` | ❌ | List keys |
| `api_keys.write` | ❌ | Issue / revoke keys |
| `project.write` | ❌ | Create/delete project, patch system prompt / rules |
| `usage.read` | ❌ | Platform usage analytics (`/web/admin/usage` — super admin only) |
| `team.write` | ❌ | Invite/remove editors or other admins |
| `billing.write` | ❌ | Subscriptions / invoices |

**Summary:** editor defaults = **knowledge + read-only project/sdk-config/actions**. Not API keys, not team, not billing analytics, not platform usage.

**Quota for tenants:** `GET /web/billing/quota` with `billing.read` (user admin has this). Admins receive email warnings at 80%/90%/100% of monthly chat allowance (configure SMTP). End users of the embed see a friendly error when quota is exceeded.

### Default permissions — user admin (account creator)

Full control within their account/org (all projects they own unless you later split orgs):

| Permission | Default |
|------------|---------|
| All of the above | ✅ on their projects |
| `team.write` | ✅ — create editors, set passwords, assign permissions |
| `billing.write` | ✅ — for their account |
| `project.write` | ✅ |
| `api_keys.write` | ✅ |

Super admin = all permissions on all tenants.

### Permission model (implementation)

Store on **membership** (user ↔ account/org ↔ project):

```text
role: 'user_admin' | 'user_editor' | 'super_admin'
permissions: string[]   // optional overrides; if empty, use role defaults
projectIds: string[]    // editors: assigned projects only; admin: all in account
```

Enforcement: after login, `StudioAuthGuard` + `RbacGuard` check `permission` + `projectId` on each `/web/*` handler.

Example: `POST /web/api-keys` requires `api_keys.write`; editor without that flag → `403` + `INSUFFICIENT_PERMISSIONS`.

### Data model (to add)

- `StudioUser` (credentials, profile)
- `Organization` / `Membership` (user ↔ org ↔ role)
- `Project` linked to org (today’s project model extended)
- Optional: refresh tokens, password reset, email verify

**Do not** reuse `ApiKeyGuard` or SDK keys for Studio users.

---

## Already implemented (APIs, not product auth)

| Area | Routes |
|------|--------|
| Projects | `GET/POST/GET/PATCH …/web/projects` (list + CRUD) |
| API keys | `POST/DELETE …/web/api-keys` |
| Actions, knowledge, sdk-config, usage | As in [README.md](./README.md) |

Shared: `packages/shared/src/api/*`. No `apps/studio` UI yet.

---

## Recommended build order

```text
1. StudioUser + signup/login + session JWT + StudioAuthGuard (replace static token)
2. Org/membership + RBAC (super admin / user admin / user editor)
3. Project scoping on all :projectId routes
4. apps/studio React (login, nav, CRUD screens)
5. List API keys, logs/aggregates, chat preview token
```

Static `STUDIO_DEV_TOKEN` can remain **only** for automated tests or a single bootstrap script until step 1 ships — not documented as the main dev workflow.

---

## Local dev (until login exists)

- **Today:** web routes open in `development` (guard no-op) so seeds work.
- **After login:** `npm run seed:studio-user` (or similar) → scripts obtain session cookie/JWT.
- **SDK playground:** unchanged — `VITE_ACTOCORE_API_KEY` on `/v1/sdk/*` only.

---

## Related

- [`README.md`](./README.md) — route tables (update when auth routes land)
- [`DEV.md`](./DEV.md) — daily workflow
- [`_docs/studio/OVERVIEW.md`](../../_docs/studio/OVERVIEW.md) — Studio product (frontend)
- [`_docs/studio/ARCHITECTURE.md`](../../_docs/studio/ARCHITECTURE.md) — `apps/studio` structure
- [`ROADMAP.md`](../../ROADMAP.md) — Studio checklist
- [`_docs/PROJECT.md`](../../_docs/PROJECT.md) — Studio responsibilities
