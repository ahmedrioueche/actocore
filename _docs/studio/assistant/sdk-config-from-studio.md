# SDK configuration from Studio

Studio **SDK config** (`Project → SDK config`) stores presentation settings per project. The embed loads them when you enable `loadRemoteConfig` on `ActocoreProvider`.

## Enable remote config

```tsx
<ActocoreProvider
  apiKey={apiKey}
  loadRemoteConfig
  actions={{ /* handlers still defined in code */ }}
>
  <ActoChatWidget />
</ActocoreProvider>
```

Runtime endpoint: `GET /v1/sdk/runtime` (authenticated with the project API key). Response includes `sdk` with theme, UI, i18n, voice, and security fields.

## What you can configure in Studio

### Appearance

- Theme mode: light, dark, or system
- Brand colors (separate light/dark palettes)
- Font family preset or custom stack

### Chat UI

- Show/hide: sources, intent badge, actions hint, action picker
- Composer min/max rows

### Copy and launcher

- Header title and subtitle
- Empty state title and description
- Placeholder, Send, Open chat labels
- Launcher icon URL and aria label
- **Launcher position** — bottom-right, bottom-left, top-right, top-left
- **Launcher offsets** — CSS lengths from screen edge (e.g. `1.25rem`, `20px`)

### What stays in code

- `apiKey` — never from dashboard
- `actions` handlers — always implemented in your app
- `launcherIcon` React node prop — overrides `iconUrl` from dashboard

## Override from code

Local props override dashboard values. Example: force dark mode in code even if Studio says light:

```tsx
<ActocoreProvider loadRemoteConfig theme={{ mode: 'dark' }}>
```

## API alternative

Patch config without Studio UI:

```bash
curl -X PATCH "$CORE_URL/v1/web/projects/PROJECT_ID/sdk-config" \
  -H "Authorization: Bearer $STUDIO_JWT" \
  -H "Content-Type: application/json" \
  -d '{"ui":{"showIntentBadge":true},"theme":{"mode":"dark"}}'
```

Studio JWT is for `/v1/web/*`; project API key is for `/v1/sdk/*`.

## Voice (optional)

Enable in Studio SDK config or via props:

- `voice.input` — microphone in composer
- `voice.output` — listen on assistant messages
- `voice.inputMode` — `browser`, `server`, or `auto`

Server transcription requires Core voice/STT configuration.
