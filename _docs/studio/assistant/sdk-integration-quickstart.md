# SDK integration quick start

The ActoCore SDK (`@ahmedrioueche/actocore-sdk`) is a React package that embeds chat (and optional voice) in your application.

## Install

```bash
npm install @ahmedrioueche/actocore-sdk
```

Peer dependency: React 18+. Import styles once:

```tsx
import '@ahmedrioueche/actocore-sdk/styles.css';
```

## Get credentials

1. In Studio, open your **project → API keys**.
2. Create a key and copy it immediately.
3. Set environment variables in your app:

```env
VITE_ACTOCORE_API_URL=https://your-core-host.example
VITE_ACTOCORE_API_KEY=aco_...
```

`baseURL` is the Core origin without `/v1` (the SDK adds the API version).

## Minimal embed

```tsx
import { ActocoreProvider, ActoChatWidget } from '@ahmedrioueche/actocore-sdk';
import '@ahmedrioueche/actocore-sdk/styles.css';

export function App() {
  return (
    <ActocoreProvider
      apiKey={import.meta.env.VITE_ACTOCORE_API_KEY}
      baseURL={import.meta.env.VITE_ACTOCORE_API_URL}
    >
      <ActoChatWidget />
    </ActocoreProvider>
  );
}
```

- `ActoChatWidget` — floating launcher + panel (default corner: bottom-right).
- `ActoChat` — inline chat without the launcher bubble.

## Required provider props

| Prop | Description |
|------|-------------|
| `apiKey` | Project API key (required) |
| `baseURL` | Core URL, e.g. `http://localhost:3000` |
| `apiVersion` | Optional; default `v1` |

## Optional provider props

- `i18n` — locale and translation overrides.
- `theme` — `light` / `dark` / `system` and CSS token overrides (`--ac-*`).
- `ui` — show sources, intent badge, composer rows, copy overrides, launcher icon.
- `voice` — microphone input and read-aloud on assistant messages.
- `security` — `allowedActionNames` allowlist before handlers run.
- `actions` — map of action names to async handler functions.
- `loadRemoteConfig` — fetch dashboard SDK settings from `GET /v1/sdk/runtime`.

## Merge order for configuration

When `loadRemoteConfig` is enabled:

**Local props → dashboard SDK config (Studio) → SDK defaults**

Props you pass in code always win over Studio settings.

## Common issues

| Problem | Fix |
|---------|-----|
| Widget does not appear | Check `apiKey` and `baseURL`; verify key is not revoked |
| 401 on chat | Wrong or missing API key |
| CORS errors | Core must allow your app origin |
| Settings from Studio ignored | Add `loadRemoteConfig` on `ActocoreProvider` |
