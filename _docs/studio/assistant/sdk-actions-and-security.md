# SDK actions and security

## How actions work

1. User sends natural language in the chat widget.
2. Core classifies intent and may propose an **action** with extracted parameters.
3. SDK shows a confirmation card; user approves.
4. SDK calls your registered **handler** in the host app.
5. Handler runs real UI logic (navigation, API calls, forms).

Actions are defined in Studio (name, description, JSON schema). Handlers are implemented only in your application code.

## Register handlers

```tsx
<ActocoreProvider
  apiKey={apiKey}
  actions={{
    create_invoice: async (input) => {
      await billingApi.createInvoice(input);
    },
    open_settings: async () => {
      navigate('/settings');
    },
  }}
>
  <ActoChatWidget />
</ActocoreProvider>
```

Handler names must match action names defined in Studio (snake_case convention).

## Security allowlist

Restrict which actions can execute in the browser:

```tsx
<ActocoreProvider
  security={{
    allowedActionNames: ['create_invoice', 'open_settings'],
    enforceActionAllowlist: true,
  }}
  actions={{ /* ... */ }}
>
```

If `enforceActionAllowlist` is true and an action is not listed, the SDK blocks execution before your handler runs.

Studio **SDK config** can also set `security.allowedActionNames` and `allowedSectionIds` when using `loadRemoteConfig`.

## Action sections in Studio

Group related actions under **sections** in Studio. You can allow entire sections via `allowedSectionIds` in SDK security config.

## Q&A vs actions

- **Q&A** — answers from knowledge base (RAG); no handler required.
- **Actions** — requires Studio definition + SDK handler + user confirmation.

Upload knowledge for product docs; define actions for operations users can trigger in your app.

## Best practices

- Keep handlers thin — call your existing app services.
- Validate parameters again server-side; never trust client-only checks.
- Use descriptive action descriptions in Studio so the model picks the right tool.
- Start with a small allowlist in production; expand as you test.
