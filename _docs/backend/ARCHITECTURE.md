# ActoCore Backend Architecture

This document describes the internal architecture of the ActoCore backend system.

The backend is responsible for processing all requests coming from the SDK and the web dashboard, and transforming them into either AI responses or executed actions.

**Route reference:** [`apps/backend/README.md`](../../apps/backend/README.md) — HTTP paths, knowledge ingest matrix, env vars.

---

# 🧠 High-Level System Overview

The backend is built as a modular AI execution system composed of clear layers:

- Entry Layer (SDK + Web requests)
- Authentication Layer
- AI Orchestrator (decision engine)
- Domain Modules (Actions, RAG, Projects, Billing)
- Infrastructure Layer (Database, Redis, External APIs)

---

## 🔄 Global Request Flow

```text id="flow"
SDK / Web Request
        ↓
Authentication Layer
        ↓
Request Context Builder (Project resolution)
        ↓
AI Orchestrator (Core Brain)
        ↓
┌───────────────────────┬───────────────────────┐
│                       │                       │
Q&A Mode (RAG)      Action Mode (Tools)     Direct Response
│                       │                       │
└───────────────→ Response Formatter ←──────────┘
        ↓
Final Response
```
