# SDK language & localization plan

> **Status:** Planning — runtime i18n plumbing exists; multi-locale Studio editing and AI reply language are not shipped.
>
> **Scope:** `packages/shared`, `packages/sdk`, `apps/backend` (chat + sdk-config), `apps/studio` (SDK config UI), integration docs.
>
> **Related:** [`ROADMAP.md`](../../ROADMAP.md) § SDK i18n · [`sdk-config-from-studio.md`](./sdk-config-from-studio.md) · [`sdk-integration-quickstart.md`](./sdk-integration-quickstart.md) · [`packages/sdk/README.md`](../../../packages/sdk/README.md)

---

## Problem

Customers want the embedded chat to:

1. **Match their app language** when the user switches locale (labels, placeholders, errors, voice).
2. **Show customized copy per language** configured in Studio (brand voice, not SDK defaults).
3. **Receive AI replies in the same language** as the active app locale (or the language the user writes in).

Today these concerns are only partially addressed.

---

## Current state (baseline)

| Area | What works | Gap |
|------|------------|-----|
| **SDK UI strings** | Bundled `en` / `fr`; `i18n.translations` deep-merge in `createActocoreI18n` | Only two bundled locales; no Studio editor for translations |
| **Studio Copy section** | Flat fields → `ui.text` (single locale) | Not aligned with `i18n.translations`; no per-locale tabs |
| **Runtime locale** | `ActocoreProvider` `i18n.locale`; `changeLanguage` on prop change | Host must pass locale; Studio has no Languages UI |
| **Merge order** | Local `i18n` overrides remote (`mergeRemoteSdkConfig`) | Documented in SDK README; no host integration guide |
| **`useUiText`** | `ui.text` overrides beat bundled i18n | Blocks clean multi-locale path while `ui.text` is primary in Studio |
| **AI replies** | System prompt scoped to app; no language instruction | `SendChatMessageDto` has no `locale`; orchestrator ignores SDK locale |
| **Backend storage** | `i18n.locale` + `i18n.translations` on sdk-config PATCH | 32 KB cap on `translations`; no `defaultLocale` / `supportedLocales` |
| **Voice** | `voice.language` separate from UI locale | Not auto-synced with active `i18n.locale` |

**Reference implementations**

- Host sync: `apps/web/src/components/home/HeroChat.tsx` passes `i18n.locale` from app i18n.
- SDK i18n keys: `packages/sdk/src/i18n/locales/en.json` (`chat.*`, `action.*`, `voice.*`, `errors.*`).
- Copy override map: `packages/sdk/src/hooks/use-ui-text.ts` (`ui.text` key → i18n path).

---

## Design principles

1. **Host owns active locale** — the customer’s language switcher sets `ActocoreProvider` `i18n.locale` at runtime. Studio does not push “current language” to end users.
2. **Studio owns locale catalog + copy bundles** — default locale, supported locales, and `translations` per locale.
3. **One storage shape** — prefer `i18n.translations[locale].chat.*` (and sibling namespaces) over parallel `ui.text` per locale.
4. **Sparse bundles** — store only customized keys; SDK bundled defaults fill gaps at runtime.
5. **AI language is explicit** — chat requests carry locale; system prompt instructs reply language.
6. **AI translate is an accelerator** — opt-in Studio action, not automatic on every edit.

---

## Target config shape

```json
{
  "i18n": {
    "defaultLocale": "en",
    "supportedLocales": ["en", "fr", "de"],
    "locale": "en",
    "translations": {
      "en": {
        "chat": {
          "title": "Acme Support",
          "placeholder": "Ask Acme anything…"
        }
      },
      "fr": {
        "chat": {
          "title": "Support Acme",
          "placeholder": "Posez votre question…"
        }
      }
    }
  }
}
```

| Field | Purpose |
|-------|---------|
| `defaultLocale` | Studio editing source; runtime fallback when host omits `locale` |
| `supportedLocales` | Locales enabled for this project (Studio tabs, validation) |
| `locale` | **Deprecated over time** — keep as alias for `defaultLocale` until migration complete |
| `translations` | Per-locale sparse overrides merged over SDK bundled JSON |

**`ui.text` migration**

- **Phase 3:** Studio writes Copy fields into `translations[defaultLocale].chat.*` (and mapped keys).
- **Compatibility:** On read, if `ui.text` exists and translations lack default locale, hydrate translations from `ui.text` (one-time merge in form layer or backend sanitize).
- **Runtime:** `useUiText` resolves via active i18n only (remove `ui.text` precedence) once Studio migration ships; until then, `ui.text` applies only when it does not conflict with active locale bundle.

---

## Goals

1. End users see chat UI in their app’s active language.
2. Project owners configure copy per supported language in Studio.
3. Assistant replies match active locale (and user message language when different).
4. Clear integration docs for react-i18next, next-intl, and generic hosts.
5. Optional AI-assisted translation in Studio to speed authoring.

---

## Non-goals (for now)

- Auto-detect locale from browser without host opt-in
- Studio UI to translate **knowledge base** documents (separate from SDK copy)
- Per-user locale persistence inside ActoCore (host/session responsibility)
- Customer choice of LLM for translation (use project’s configured model)
- RTL layout polish beyond what CSS tokens already allow
- Syncing with Crowdin/Lokalise APIs (document manual export/import only)

---

## Phase 1 — AI reply language + host integration (1 week)

*Smallest slice that fixes “AI still replies in English when my app is French.”*

### 1.1 Send locale with chat messages

**Tasks**

- [ ] Add optional `locale?: string` to `SendChatMessageDto` (`packages/shared/src/dtos/chat.dto.ts`) — BCP-47, max length 35
- [ ] SDK `useActocoreChat`: include `resolved.i18n.locale` on `sendMessage` / stream body
- [ ] Marketing chat path: same field when locale is known

**Files:** `packages/shared/src/dtos/chat.dto.ts`, `packages/sdk/src/hooks/use-actocore-chat.ts`, `packages/shared/src/api/chat-stream.ts` (if body typed there)

**Acceptance:** Network tab shows `locale: "fr"` on `POST /v1/sdk/chat` when provider `i18n.locale` is `fr`.

---

### 1.2 System prompt language instruction

**Tasks**

- [ ] Resolve effective locale in orchestrator: request `locale` → project `sdk.i18n.defaultLocale` / `sdk.i18n.locale` → `en`
- [ ] Append to `buildAppAssistantSystemPrompt`: respond in that language; match user’s language if they write in another
- [ ] Unit tests for prompt fragment and locale resolution

**Files:** `apps/backend/src/orchestrator/app-assistant-prompt.util.ts`, `apps/backend/src/orchestrator/chat-orchestrator.service.ts`, `*.spec.ts`

**Acceptance:** With `locale: "fr"` and stub LLM, system prompt contains French reply instruction; manual test with real LLM returns French for French UI.

---

### 1.3 Voice locale sync

**Tasks**

- [ ] In `resolveConfig`, when `voice.language` unset, default to `i18n.locale` (or primary subtag)
- [ ] Document behavior in SDK README

**Files:** `packages/sdk/src/config/resolve-config.ts`, `packages/sdk/README.md`

**Acceptance:** Voice input/output uses active UI locale without duplicate config.

---

### 1.4 Host integration doc (v1)

**Tasks**

- [ ] Add [`sdk-language-integration.md`](./sdk-language-integration.md):
  - Pass `i18n.locale` from app language switcher
  - `loadRemoteConfig` + local locale override pattern
  - Optional `i18n.translations` for tenant-specific overrides
  - AI reply language behavior after Phase 1
- [ ] Link from `sdk-integration-quickstart.md` and `sdk-config-from-studio.md`

**Acceptance:** Doc includes copy-paste examples for react-i18next and a minimal `useState` locale toggle.

---

## Phase 2 — Schema & backend (3–5 days)

### 2.1 Extend `SdkI18nConfig`

**Tasks**

- [ ] Add `defaultLocale?: string` and `supportedLocales?: string[]` to `SdkI18nConfig` (shared types + DTO)
- [ ] `pickI18n` / merge: validate locale codes (trim, lowercase primary subtag, max 35 chars)
- [ ] `supportedLocales` must include `defaultLocale`; dedupe; max 20 locales
- [ ] If only `locale` set (legacy), treat as `defaultLocale` on read
- [ ] Bump or make configurable `SDK_CONFIG_MAX_TRANSLATIONS_BYTES` (e.g. 128 KB) with test

**Files:** `packages/shared/src/types/sdk-config.ts`, `packages/shared/src/dtos/sdk-config.dto.ts`, `apps/backend/src/projects/sdk-config/sanitize-sdk-config.util.ts`, `*.spec.ts`

**Acceptance:** PATCH accepts new fields; runtime `GET /v1/sdk/runtime` returns them; invalid locale codes rejected.

---

### 2.2 Runtime merge

**Tasks**

- [ ] Ensure `mergeRemoteSdkConfig` passes `defaultLocale` / `supportedLocales` through
- [ ] When host omits `i18n.locale`, SDK falls back to `remote.i18n.defaultLocale` then `en`

**Files:** `packages/sdk/src/config/merge-remote-sdk-config.ts`, `packages/sdk/src/config/resolve-config.ts`, tests

**Acceptance:** `loadRemoteConfig` only + `defaultLocale: "fr"` shows French UI without host passing locale (fallback case).

---

## Phase 3 — Studio Languages + multi-locale Copy (2–3 weeks)

### 3.1 Languages & labels section (single nav item)

**Tasks**

- [x] Rename nav/section from Copy & labels → **Languages & labels** (`languages` hash id)
- [x] Supported languages block at top: default locale + `en`/`fr` toggles → `i18n.locale` + `i18n.supportedLocales`
- [ ] Locale tabs under **Labels** for per-locale copy → `i18n.translations`
- [ ] Form state: `translationsByLocale: Record<string, Partial<SdkCopyFields>>` or nested `translations`
- [ ] Empty field = omit key (runtime uses SDK default for that locale)
- [ ] Show “using default” placeholder from bundled `en.json` / `fr.json` (import or duplicated constants)
- [ ] Migrate existing `ui.text` into `translations[defaultLocale]` on load
- [ ] PATCH writes `i18n.translations` only (stop writing `ui.text` for new saves; optional dual-write during transition)

**Files:** `SdkConfigCopySection.tsx`, `sdk-config-form.ts`, `sdk-config-defaults.ts`, `sanitize` (if server-side migration)

**Acceptance:** Configure French header title only; English unchanged; SDK preview/widget reflects tab locale when preview locale toggle exists.

---

### 3.3 SDK preview locale toggle

**Tasks**

- [ ] `SdkWidgetPreview`: dropdown to preview as any `supportedLocale` (temporarily set provider `i18n.locale` + merge translations)
- [ ] Persist preview choice in sessionStorage optional

**Files:** `apps/studio/src/components/sdk-config/SdkWidgetPreview.tsx`

**Acceptance:** Studio preview matches embedded widget for each configured locale without publishing code changes.

---

### 3.4 `useUiText` / remote config alignment

**Tasks**

- [ ] Prefer i18n `t()` for all `useUiText` keys when translation exists for active locale
- [ ] Deprecate `ui.text` in Studio docs; keep read merge for backward compatibility
- [ ] `mergeRemoteSdkConfig`: consider merging legacy `ui.text` into active locale at runtime (transition helper) OR one-time backend migration

**Files:** `packages/sdk/src/hooks/use-ui-text.ts`, `merge-remote-sdk-config.ts`

**Acceptance:** Project with only `i18n.translations` (no `ui.text`) renders custom copy; old projects with `ui.text` still work.

---

## Phase 4 — AI translate in Studio (1–2 weeks)

### 4.1 Translate API

**Tasks**

- [ ] `POST /v1/web/projects/:id/sdk-config/translate-copy` (Studio JWT)
  - Body: `sourceLocale`, `targetLocales[]`, `keys[]` (optional — default all customizable keys)
  - Uses project LLM; returns proposed `translations` patch (does not auto-save)
- [ ] Rate limit / quota check aligned with existing LLM usage
- [ ] Sanitize output (max lengths per field, strip HTML)

**Files:** new controller/service under `apps/backend/src/projects/sdk-config/`, shared DTO

**Acceptance:** Translate EN → FR returns French strings; user must click Save to persist.

---

### 4.2 Studio translate UX

**Tasks**

- [ ] Copy section: **Translate from {default}** button (per locale tab + “all missing locales”)
- [ ] Modal: show diff / editable results before apply to form state
- [ ] Loading + error states; toasts on failure
- [ ] Disable when source locale strings empty

**Files:** `SdkConfigCopySection.tsx`, new `SdkConfigTranslateModal.tsx`

**Acceptance:** Author fills English only → translate → review → save → runtime French works.

---

## Phase 5 — Docs, playground & polish (ongoing)

**Tasks**

- [ ] Expand `sdk-language-integration.md` with next-intl example and `hostContext.custom` escape hatch (if needed)
- [ ] Update `sdk-config-from-studio.md` — Languages + multi-locale Copy
- [ ] `apps/sdk-playground`: locale switcher + remote translations demo
- [ ] Manual E2E checklist row: switch app locale → UI + AI reply language
- [ ] ROADMAP checkboxes under SDK i18n section

---

## Customizable copy keys (v1)

| Studio label | Storage path | Notes |
|--------------|--------------|-------|
| Header title | `chat.title` | |
| Header subtitle | `chat.subtitle` | |
| Empty title | `chat.emptyTitle` | |
| Empty description | `chat.emptyDescription` | |
| Actions hint | `chat.actionsHint` | |
| Placeholder | `chat.placeholder` | |
| Send | `chat.send` | |
| Open chat | `chat.open` | |
| New conversation | `chat.newConversation` | |
| Minimize | `chat.minimize` | |
| Stop generating | `chat.stop` | |
| Loading (init) | `chat.loading` | Distinct from Loading *section* styles |
| Thinking | `chat.thinking` | |
| Launcher aria | `chat.open` or dedicated key | Align with `ui.launcher.ariaLabel` — pick one source of truth |

**v2 candidates:** `action.*`, `errors.TOO_MANY_REQUESTS`, `voice.*` (advanced accordion in Copy).

---

## Testing strategy

| Layer | Tests |
|-------|--------|
| Shared DTOs | Validation for locale codes, supported list rules |
| Backend sanitize | `pickI18n`, translation size, merge |
| Orchestrator | Prompt includes language line; locale resolution order |
| SDK | `mergeRemoteSdkConfig` fallback locale; `useUiText` with translations |
| Studio | Form round-trip `configToFormState` ↔ `formStateToPatch`; optional RTL component tests for locale tabs |
| E2E | PATCH sdk-config with translations → runtime GET → widget shows localized header |

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `ui.text` vs `translations` drift | Dual-read during migration; Studio stops writing `ui.text` |
| 32 KB translation cap | Sparse keys only; raise cap; reject with clear Studio error |
| Host forgets to pass `locale` | Fallback to `defaultLocale`; docs + console dev warning in SDK dev build |
| AI translate quality | Human review modal; never auto-save |
| Locale codes inconsistent (`en` vs `en-US`) | Normalize to primary subtag in sanitize; display full code in UI |

---

## Open questions

1. **Should `supportedLocales` include SDK-bundled locales not yet customized?** Recommendation: yes — they appear in tabs with defaults until edited.
2. **Single `copy` nav vs split `languages` + `copy`?** **Done:** single **Languages & labels** section (`#languages`); supported languages on top, labels below.
3. **Backend migration job for existing `ui.text` → translations?** Recommendation: client-side on Studio load first; optional server migration later.
4. **Reply locale vs UI locale split?** Defer — single `locale` unless enterprise customers ask.

---

## Suggested implementation order

```
Phase 1 (AI + host docs) → Phase 2 (schema) → Phase 3 (Studio UI) → Phase 4 (AI translate) → Phase 5 (polish)
```

Phase 1 and 2 can overlap slightly (schema additions do not block chat `locale` field).

---

## ROADMAP linkage

Add under **SDK package → Internationalization**:

- [ ] Chat requests include locale; orchestrator reply language
- [ ] Studio Languages section (`defaultLocale`, `supportedLocales`)
- [ ] Studio multi-locale Copy → `i18n.translations`
- [ ] Studio AI translate copy (opt-in)
- [ ] [`sdk-language-integration.md`](./sdk-language-integration.md) host guide
