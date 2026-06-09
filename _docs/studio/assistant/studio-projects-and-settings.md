# Studio projects and settings

## Creating a project

1. Open **Projects** in the sidebar.
2. Click **Create project** and enter a name.
3. Open the project to access Docs, API keys, Knowledge, Actions, SDK config, Usage, and **Settings**.

Project limits depend on your subscription plan (max projects and team seats).

## Project settings

Path: **Project → Settings** (`/projects/{projectId}/settings`).

- **Edit name** — users with project write permission can rename the project.
- **Project ID** — read-only; use when calling APIs or support.
- **Delete project** — workspace admins only. Opens a confirmation modal; you must type the exact project name to confirm. Deletes API keys, knowledge, actions, sessions, and usage for that project permanently.

## API keys

Path: **Project → API keys**.

- Create named keys for development and production.
- Keys authenticate SDK and server calls to `/v1/sdk/*`.
- Revoke compromised keys; rotate all keys if needed.
- Keys are shown once at creation — store them securely (e.g. env vars).

## Knowledge

Path: **Project → Knowledge**.

Supported source types:

- **Text** — paste markdown or plain text.
- **URL** — fetch and index a public page.
- **Document** — upload PDF, markdown, or plain text files.

After ingest, status becomes **ready** when chunks are indexed. The assistant uses this content for Q&A (RAG).

## Actions

Path: **Project → Actions**.

- Organize actions into **sections** (optional).
- Each action has a name, description, and JSON schema for parameters.
- The AI selects actions from natural language; the SDK runs your handler after user confirmation.
- Enable/disable actions and sections without deleting them.

## Usage

Path: **Project → Usage**.

View chat/token usage for the project (subject to plan quotas).
