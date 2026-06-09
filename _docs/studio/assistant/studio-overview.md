# ActoCore Studio overview

ActoCore Studio is the web dashboard (control plane) for developers who integrate ActoCore into their applications. Studio does not run AI itself — it configures projects that the Core backend and embeddable SDK use at runtime.

## What you can do in Studio

- **Projects** — one project per app or environment. Each project has its own API keys, knowledge, actions, and SDK settings.
- **Knowledge** — upload text, URLs, or documents so the assistant can answer questions (RAG).
- **Actions** — define tools the AI can propose; your app implements handlers with the SDK.
- **SDK config** — theme, copy, launcher position, UI flags; applied when the host app uses `loadRemoteConfig`.
- **API keys** — create and revoke keys used by the embeddable SDK (`Authorization: Bearer` on `/v1/sdk/*`).
- **Team** — workspace admins invite editors and assign project access.
- **Billing & subscription** — plans, usage meters, payment history (workspace admins).

## Roles

| Role | Access |
|------|--------|
| **User admin** | Full workspace: billing, team, all projects, delete projects |
| **User editor** | Login with workspace ID + username + password; only assigned projects |
| **Super admin** | Platform operator (separate admin app) |

Editors can configure assigned projects if they have write permissions. Only workspace admins can delete projects, manage billing, and invite team members.

## Auth model

- Studio users sign in with **JWT** on `/v1/web/*` routes.
- End-user apps embed the SDK with a **project API key** on `/v1/sdk/*` routes.
- Never put tenant project API keys in Studio env for normal dashboard use. The optional in-Studio chat widget uses a separate **platform** API key (`VITE_ACTOCORE_API_KEY`) for ActoCore product help only.

## ActoCore Assistant widget in Studio

When `VITE_ACTOCORE_API_KEY` is set (via `npm run setup:assistant` in `apps/studio`), a floating chat widget appears after login. That bot answers questions about Studio and SDK integration — it is **not** your tenant project's assistant.

Setup: add `STUDIO_SETUP_EMAIL` and `STUDIO_SETUP_PASSWORD` to `apps/studio/.env`, run `npm run setup:assistant`, restart the dev server.
