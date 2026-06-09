# @ahmedrioueche/actocore-sdk

Embeddable React chat SDK for ActoCore projects.

**Monorepo developer guide:** [DEV.md](./DEV.md) (playground, build, shared package, manual testing).

## Install

Published on the **public npm registry** (no `.npmrc` required):

```bash
npm install @ahmedrioueche/actocore-sdk
```

`@ahmedrioueche/actocore-shared` is installed automatically as a dependency. You only need a separate install if you import shared types/APIs directly in your app.

## Required host configuration

| Variable / prop | Purpose |
|----------------|---------|
| `apiKey` (required) | Project API key from ActoCore (`Bearer` on SDK routes) |
| `baseURL` (recommended) | Core origin, e.g. `http://localhost:3000` (Vite: `VITE_ACTOCORE_API_URL`) |
| `apiVersion` (optional) | API prefix segment (default `v1`) |

Example (Vite):

```env
VITE_ACTOCORE_API_URL=http://localhost:3000
VITE_ACTOCORE_API_KEY=ac_...
```

Create a project and key via backend web routes — see [`apps/backend/README.md`](../../apps/backend/README.md).

## Quick start

```tsx
import { ActocoreProvider, ActoChat } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';

export function App() {
  return (
    <ActocoreProvider
      apiKey={import.meta.env.VITE_ACTOCORE_API_KEY}
      baseURL={import.meta.env.VITE_ACTOCORE_API_URL}
      i18n={{ locale: 'en' }}
      theme={{ mode: 'light' }}
      security={{ allowedActionNames: ['deploy'], enforceActionAllowlist: true }}
      ui={{ showSources: true, showIntentBadge: true }}
      actions={{
        deploy: async (input) => {
          console.log('deploy action payload', input);
        },
      }}
    >
      <ActoChat />
    </ActocoreProvider>
  );
}
```

## Configuration

- `apiKey` (required): project SDK/API key from ActoCore.
- `baseURL` (optional): Core URL (example `http://localhost:3000`).
- `apiVersion` (optional): API prefix version.
- `i18n.locale`: current language (`en`, `fr`, ...).
- `i18n.translations`: deep overrides for SDK copy without forking UI.
- `theme.mode`: `light` | `dark` | `system`.
- `theme.tokens`: token overrides mapped to `--ac-*` CSS vars.
- `security.allowedActionNames`: allowlist for executable actions.
- `security.enforceActionAllowlist`: block non-allowlisted actions.
- `ui.showSources`, `ui.showIntentBadge`, `ui.showActionsHint`, `ui.composerMinRows`, `ui.composerMaxRows`.
- `ui.text` — override header, empty state, placeholder, etc. without forking components.
- `ui.launcher.iconUrl` — custom launcher image; default is built-in chat bubble SVG.
- `i18n.translations` — full locale overrides (alternative to `ui.text`).
- `voice.input` / `voice.output` — microphone dictation and read-aloud on assistant messages (default **on**; set `false` to hide).
- `voice.inputMode` — `browser` (Web Speech API), `server` (POST audio to Core STT), or `auto` (default).
- `voice.autoSendOnFinalize` — send when dictation completes (default `false`; user taps Send).
- `loadRemoteConfig` — fetch `GET /v1/sdk/runtime` and merge `sdk` settings (dashboard) under local props.
- `persistSession` (default `true`) — restore the last chat session from `localStorage` on mount (scoped by API key, base URL, and `externalUserId`).
- `externalUserId` — stable host user id for session scoping and persistence (pass from your auth layer).
- `streamResponses` (default `true`) — stream assistant replies over SSE (`POST /v1/sdk/chat/stream`) so tokens appear as they are generated. The composer shows a **Stop** control while streaming; partial text is kept and billing uses tokens actually generated. Set `false` to use the legacy JSON `POST /v1/sdk/chat` endpoint only. If the stream route is unavailable (404/501), the SDK falls back to JSON automatically.

### Dashboard-driven config (no Studio UI required)

Patch project SDK settings via control plane API:

```bash
curl -X PATCH "http://localhost:3000/v1/web/projects/PROJECT_ID/sdk-config" \
  -H "Content-Type: application/json" \
  -d '{"ui":{"showIntentBadge":true},"i18n":{"locale":"fr"},"security":{"allowedActionNames":["list_users"]}}'
```

In the host app, enable remote merge:

```tsx
<ActocoreProvider apiKey={key} loadRemoteConfig>
  <ActoChatWidget />
</ActocoreProvider>
```

Merge order: **local props override dashboard (`runtime.sdk`) override SDK defaults.**

Override copy without forking components — either shallow `ui.text` or full locale bundles:

```tsx
<ActocoreProvider
  i18n={{
    locale: 'fr',
    translations: {
      fr: {
        chat: { placeholder: 'Écrivez à Acme…' },
      },
    },
  }}
  ui={{ text: { headerTitle: 'Acme Support' } }}
>
```

`ui.text` applies for the active locale; `i18n.translations` deep-merges over bundled SDK locale JSON.

- `voice.language` — BCP-47 hint for speech recognition.

### Voice

Enable on the provider:

```tsx
<ActocoreProvider
  voice={{
    input: true,
    output: true,
    inputMode: 'auto',
    language: 'en',
  }}
>
  <ActoChat />
</ActocoreProvider>
```

Server transcription requires `VOICE_STT_PROVIDER=openai` and `OPENAI_API_KEY` on Core (`POST /v1/sdk/voice/transcribe`). With `stub`, only browser dictation works unless you use server mode (stub returns a demo phrase).

### Customize copy (header and more)

```tsx
<ActocoreProvider
  ui={{
    text: {
      headerTitle: 'Acme Support',
      headerSubtitle: 'Ask questions or run actions like deploy.',
      actionsHint: 'Try: "deploy staging" or "summarize my account".',
      placeholder: 'Message Acme…',
    },
    launcher: {
      iconUrl: 'https://cdn.example.com/chat-icon.svg',
      ariaLabel: 'Open Acme chat',
    },
  }}
>
  <ActoChatWidget launcherIcon={<img src="/custom.svg" alt="" />} />
</ActocoreProvider>
```

Priority for launcher/header icon: `launcherIcon` prop → `ui.launcher.iconUrl` → default SVG (same image in the floating launcher and chat header).

## i18n rule

All user-facing SDK text must be translated through i18n keys. Do not hardcode user copy in components.

## Theming rule

Use design tokens only (`var(--ac-*)`) for colors, spacing, typography, radii, and layout constants.

## Security rule

Core validates action schemas. SDK additionally enforces the host allowlist before invoking handlers.

