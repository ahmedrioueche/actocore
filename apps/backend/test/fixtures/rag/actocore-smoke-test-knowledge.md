# ActoCore Product Guide (RAG smoke test)

This document is a **sample knowledge source** for testing retrieval and chat Q&A. It contains fictional but consistent product facts you can query after upload and re-index.

---

## What is ActoCore?

**ActoCore** is a platform for building AI-powered product experiences. Teams connect their apps through the ActoCore SDK, configure knowledge sources in Studio, and expose guided actions and Q&A to end users.

Core capabilities include:

- **Knowledge RAG** — upload documents, chunk and embed them, retrieve relevant passages at question time
- **Guided actions** — declarative flows the assistant can trigger in your product
- **Studio** — web console for projects, API keys, knowledge management, and analytics

ActoCore is designed for B2B SaaS teams that need grounded answers without maintaining a separate vector database on day one.

---

## Plans and limits

| Plan | Monthly price | Knowledge sources | API requests / month |
|------|---------------|-------------------|----------------------|
| Starter | $29 | 5 | 10,000 |
| Growth | $99 | 25 | 100,000 |
| Enterprise | Custom | Unlimited | Custom |

**Starter** includes email support only. **Growth** adds priority support and query rewrite. **Enterprise** adds SSO, dedicated success manager, and custom SLAs.

Trial accounts expire after **14 days** unless upgraded.

---

## Error codes

When the SDK or API returns an error, the `code` field identifies the failure. Support and logs use the same identifiers.

| Code | HTTP | Meaning | What to do |
|------|------|---------|------------|
| **ERR-404** | 404 | Workspace or project not found | Verify `projectId` and that the API key belongs to that workspace |
| **ERR-401** | 401 | Invalid or revoked API key | Rotate the key in Studio → Project → API keys |
| **ERR-429** | 429 | Rate limit exceeded | Back off with exponential retry; upgrade plan if sustained |
| **ERR-503** | 503 | Knowledge index not ready | Wait for `indexStatus` to become `ready`; re-index if stuck on `failed` |
| **ERR-RAG-EMPTY** | 200 | No chunks matched the query | Broaden the question, check page scope, or add more knowledge |

If you see **ERR-404 workspace missing**, the project ID in your SDK init does not exist in the environment you are calling (staging vs production is a common mix-up).

---

## SDK quick start

1. Create a project in **Studio** and copy the **publishable API key** (`pk_live_…` or `pk_test_…`).
2. Install the SDK: `npm install @actocore/sdk`
3. Initialize:

```javascript
import { ActoCore } from "@actocore/sdk";

const acto = ActoCore.init({
  projectId: "your-project-id",
  apiKey: process.env.ACTOCORE_PUBLISHABLE_KEY,
});
```

4. Ask a question with page context so retrieval respects **app page scope**:

```javascript
const answer = await acto.ask({
  question: "How do I reset my password?",
  pageId: "settings-security",
});
```

5. Check `answer.citations` for source references `[1]`, `[2]`, etc.

Never embed **secret** keys (`sk_…`) in browser or mobile clients.

---

## Knowledge and re-indexing

After you upload or edit a `.md`, `.txt`, or `.pdf` file:

1. Open **Studio → Project → Knowledge**
2. Confirm **index status** shows `ready` (not `pending` or `failed`)
3. Use **Re-index** on the source detail page if you changed embedding settings or page scope

**Page scope** limits which app pages may retrieve a source. A document scoped only to `billing` will not appear on the `onboarding` page.

Supported upload formats: **Markdown**, plain text, PDF (text layer; scanned PDFs without OCR may fail).

Maximum file size per upload: **10 MB**.

---

## Billing and refunds

Invoices are issued on the **1st of each month** for the previous period. Failed card charges retry **3 times** over 7 days before the workspace is suspended.

**Refund policy:** Annual plans may request a pro-rated refund within **30 days** of purchase by emailing `billing@actocore.example`. Monthly plans are non-refundable except for duplicate charges.

Tax IDs (VAT/GST) can be added under **Workspace → Billing → Tax information**.

---

## Support

| Channel | Hours (UTC) | Plans |
|---------|-------------|-------|
| Email support@actocore.example | Mon–Fri 09:00–17:00 | All |
| Priority queue | Mon–Fri 08:00–20:00 | Growth, Enterprise |
| Phone (Enterprise only) | 24×7 for P1 incidents | Enterprise |

Status page: `https://status.actocore.example`

For **ERR-503** or ingestion failures lasting more than 1 hour, open a ticket with the **knowledge source ID** and last `errorMessage` from Studio.

---

## Security notes

- API keys are scoped to a single project unless marked workspace-admin (internal only).
- All traffic must use **HTTPS**; the SDK rejects plain HTTP in production mode.
- Knowledge content is stored encrypted at rest; embeddings are stored separately from raw files in the current architecture.

Rotate keys immediately if a **secret key** (`sk_…`) is committed to git or exposed in client-side code.

---

## Suggested chat questions (for manual testing)

After upload and re-index, try asking:

1. *What is ActoCore?* — should mention platform, SDK, Studio, RAG
2. *What does ERR-404 mean?* — workspace/project not found
3. *How much does the Growth plan cost?* — $99
4. *How long is the trial?* — 14 days
5. *What is the refund policy for annual plans?* — 30 days pro-rated
6. *What file formats can I upload?* — Markdown, text, PDF
7. *How do I initialize the SDK?* — `ActoCore.init` with projectId and apiKey

If answers are vague or wrong, check index status, page scope, and embedding provider settings, then re-index.
