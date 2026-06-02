# @ahmedrioueche/actocore-sdk

Embeddable React chat SDK for ActoCore projects.

## Install

```bash
npm install @ahmedrioueche/actocore-sdk
```

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
- `voice.input` / `voice.output` — microphone dictation and read-aloud on assistant messages.
- `voice.inputMode` — `browser` (Web Speech API), `server` (POST audio to Core STT), or `auto` (default).
- `voice.autoSendOnFinalize` — send when dictation completes (default `false`; user taps Send).
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

Priority for launcher icon: `launcherIcon` prop → `ui.launcher.iconUrl` → default SVG.

## i18n rule

All user-facing SDK text must be translated through i18n keys. Do not hardcode user copy in components.

## Theming rule

Use design tokens only (`var(--ac-*)`) for colors, spacing, typography, radii, and layout constants.

## Security rule

Core validates action schemas. SDK additionally enforces the host allowlist before invoking handlers.

