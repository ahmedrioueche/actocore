# SDK tools vs actions

ActoCore uses two capability layers. Both are “tools” in LLM terms, but they execute in different places.

## Core tools (read / query)

**Core tools** run on ActoCore Core. They do not execute code in the customer’s browser and do not require a confirmation card.

| Tool | Purpose |
|------|---------|
| `search_knowledge` | RAG over your knowledge base (Q&A with citations) |
| `list_app_pages` | List App layout screens and routes |
| `describe_current_page` | Answer “where am I?” from `hostContext` |
| `list_actions` | Summarize configured in-app actions |
| `get_action_schema` | Return JSON schema for a named action |

Enable or disable built-in tools per project in Studio → **Tools**.

## Actions (host execute)

**Actions** are tools that **your application runs** after the user clicks **Run** in the chat widget.

1. Define in Studio → **Actions** (name, description, JSON schema).
2. Register handlers on `ActocoreProvider`.
3. Optionally link actions to App layout pages.
4. User confirms in `ActionPendingCard` before execution.

See [sdk-actions-and-security.md](./sdk-actions-and-security.md).

## App layout (context, not execution)

**Pages** describe screens (`title`, `route`, `description`). They help the assistant explain navigation and scope actions — they are not executable tools.

- Pass `hostContext.route` (and `currentPage` slug when known) from your app.
- Link **actions** to pages when an operation is page-specific.
- Optionally link **core tools** to pages in Studio → Tools for ranking/scoping.

## Discovery API

`GET /v1/sdk/manifest` returns a unified manifest: pages, actions, and enabled core tools.

```bash
curl -H "Authorization: Bearer $API_KEY" \
  https://your-api/v1/sdk/manifest
```

## When to use what

| User need | Use |
|-----------|-----|
| Answer from docs / knowledge | Core tool `search_knowledge` |
| “What page am I on?” | Core tool `describe_current_page` + `hostContext` |
| Create invoice, open settings, etc. | **Action** + SDK handler |
| Explain what a screen is for | App layout page `description` |
