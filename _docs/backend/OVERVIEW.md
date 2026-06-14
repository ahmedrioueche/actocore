# ActoCore Backend

The ActoCore backend is the central system that powers all AI reasoning, action execution, and data processing for applications using ActoCore.

**Local development:** [`apps/backend/DEV.md`](../../apps/backend/DEV.md) · **API reference:** [`apps/backend/README.md`](../../apps/backend/README.md)

It is responsible for transforming natural language requests from the SDK into either:

- Informational responses (Q&A mode)
- Executed actions inside the target application (Action mode)

---

# 🧠 Purpose

The backend is the **brain of ActoCore**.

It handles:

- Understanding user intent
- Communicating with LLMs
- Executing structured actions
- Retrieving knowledge base context
- Ensuring security and multi-tenant isolation

---

# ⚙️ Core Responsibilities

## 1. AI Processing

- Connect to LLM providers (OpenAI / Claude)
- Classify intent:
  - Q&A (knowledge-based response)
  - Action (execute function/tool)
- Generate structured outputs

---

## 2. Action Execution

- Define available actions per project
- Validate AI-selected actions
- Execute safe, schema-validated operations
- Return structured results to SDK

---

## 3. Knowledge System (RAG)

- Store application-specific knowledge
- Generate embeddings
- Retrieve relevant context for questions
- Improve AI accuracy using project data

**Roadmap:** [`RAG-PLAN.md`](./RAG-PLAN.md) — professionalization plan (chunking, hybrid search, vector index, Studio tools).

---

## 4. Multi-Tenant System

- Each application is isolated by project
- No cross-project data access
- API key-based authentication per project

---

## 5. Observability

- Log all requests
- Track AI decisions
- Record executed actions
- Monitor errors and latency

---

## 6. Billing & Usage Tracking

- Track API usage per project
- Measure token consumption
- Enforce rate limits and quotas

---

# 📖 API reference (implemented routes)

For endpoint tables, knowledge ingest matrix, env vars, and curl examples, see **[`apps/backend/README.md`](../../apps/backend/README.md)**.

---

# 🔌 Entry Points

The backend is accessed through:

## 1. SDK Requests

- User interactions inside customer applications
- Real-time AI + action execution

## 2. Web Requests

- Developer dashboard configuration
- Managing projects, actions, and knowledge base

---

# 🧩 Core Principle

> The backend is the single source of truth for all AI decisions, execution logic, and application data.

No other layer:

- makes decisions
- executes actions
- accesses raw data directly

---

# 🧠 Summary

The backend is:

- an AI orchestration system
- an action execution engine
- a multi-tenant SaaS core
- the intelligence layer of ActoCore
