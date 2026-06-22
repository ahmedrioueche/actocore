# SDK — developer guide

Working on `@ahmedrioueche/actocore-sdk` inside the monorepo. Consumer-facing install and props: [README.md](./README.md).

---

## Daily workflow

**1. Backend** (required for real chat):

```powershell
# repo root
docker compose -f compose.yml up -d
npm run dev:backend
```

**2. Playground** (local host app, links to `file:../../packages/sdk`):

```powershell
cd apps/sdk-playground
cp .env.example .env
npm install
npm run setup    # project + API key + seeds
npm run dev      # http://localhost:5173
```

From repo root:

```powershell
npm run dev:playground
npm run playground:setup
```

**3. After SDK source changes**

Vite hot-reloads TSX. If types or exports change, rebuild:

```powershell
cd packages/sdk
npm run build
```

Then refresh the playground tab.

---

## Monorepo wiring

| Package | How playground uses it |
|---------|-------------------------|
| `packages/sdk` | `"@ahmedrioueche/actocore-sdk": "file:../../packages/sdk"` in playground `package.json` |
| `packages/shared` | Transitive via SDK (`^0.0.24` on npm) **or** link locally while editing shared |

### Editing `packages/shared` and SDK together

SDK’s `package.json` points at **published** shared (`^0.0.24`). For same-day DTO changes:

```powershell
cd packages/shared
npm run build

cd ../sdk
# optional: npm install file:../shared --save  (temporary local link)
npm run build
```

Backend already uses `file:../../packages/shared` — restart backend after shared API/type changes.

### Published npm vs monorepo

- **You (monorepo):** playground → `file:../../packages/sdk`
- **External apps:** `npm install @ahmedrioueche/actocore-sdk` — see [README.md](./README.md) and [`packages/PUBLISH.md`](../PUBLISH.md)

Smoke-test a published tarball outside the repo: `apps/sdk-install-check` (update version when you release).

---

## Playground env

`apps/sdk-playground/.env`:

```env
VITE_ACTOCORE_API_KEY=ac_...    # from npm run setup
# VITE_ACTOCORE_PROJECT_ID=     # optional — reuse same project for seeds
```

| Script | Purpose |
|--------|---------|
| `npm run setup` | Project, key, actions, knowledge |
| `npm run seed:actions` | Demo actions (`add_user`, `list_users`, …) |
| `npm run seed:knowledge` | FAQ for Q&A; `--file` / `--upload` for your docs |
| `npm run config:fr` | PATCH sdk-config (French + remote config test) |
| `npm run config:allowlist` | Server allowlist: `list_users` only |
| `npm run config:reset` | Reset sdk-config |

If backend has `STUDIO_AUTH_REQUIRED=true`, set in the shell before seeds:

```powershell
$env:STUDIO_DEV_TOKEN = "dev-studio-secret"
npm run setup
```

---

## SDK layout

| Path | Contents |
|------|----------|
| `src/provider/` | `ActocoreProvider`, context, `loadRemoteConfig` |
| `src/components/` | `ActoChat`, composer, messages, actions, voice UI |
| `src/hooks/` | `useActocoreChat`, session, runtime |
| `src/i18n/` | Locales (`en`, `fr`) — **no hardcoded user strings in components** |
| `src/styles/` | `tokens.css`, component CSS using `var(--ac-*)` |
| `src/config/` | Merge remote sdk-config with local props |

HTTP calls go through **`@ahmedrioueche/actocore-shared`** (`chatApi`, `sessionsApi`, …), not raw fetch in components.

---

## Tests

```powershell
cd packages/sdk
npm run test          # vitest
npm run test:watch
```

When changing merge logic for dashboard config: `src/**/merge-remote-sdk-config.spec.ts` (or similar).

Backend e2e covers allowlist + sdk-config; playground [MANUAL_E2E.md](../../apps/sdk-playground/MANUAL_E2E.md) covers UI.

---

## What to test manually

1. **Chat** — direct reply, Q&A with sources, action pending + confirm.
2. **`loadRemoteConfig`** — toggle in playground sidebar; run `config:fr` / `config:allowlist`.
3. **Allowlist** — `enforceActionAllowlist` + handler registry; blocked action shows i18n denial.
4. **Voice** — browser dictation; server mode needs Core `VOICE_STT_PROVIDER=openai`.
5. **Theme / i18n** — `theme.tokens`, `i18n.translations`, `ui.text` overrides.

Knowledge upload is **not** in the SDK — only Studio/web (`knowledgeApi` in shared).

---

## Build and publish

```powershell
cd packages/sdk
npm run build       # tsc + copy styles.css
npm run test
npm run publish:public   # after bumping version; publish shared first
```

Export map: main entry, `styles.css`. Host apps must import:

```ts
import '@ahmedrioueche/actocore-sdk/styles.css';
```

---

## Conventions (quick)

- All UI copy → `useTranslation()` / i18n keys.
- Colors/spacing → CSS variables `--ac-*`, not literals in TSX.
- `ActocoreProvider` props override `GET /sdk/runtime` → `sdk` when `loadRemoteConfig` is on.
- Register `actions={{ name: handler }}` for every action name enabled in Studio/sdk-config.

---

## Related

- [README.md](./README.md) — install, props, voice, remote config
- [Backend DEV.md](../../apps/backend/DEV.md) — API, env, studio auth
- [Playground README](../../apps/sdk-playground/README.md)
- [MANUAL_E2E.md](../../apps/sdk-playground/MANUAL_E2E.md)
- [`_docs/RULES.md`](../../_docs/RULES.md) — shared-first types, i18n rules
