# ActoCore

ActoCore is an AI integration layer that allows developers to embed natural language interaction into their applications. It enables end users to both ask questions about an application and execute actions inside it using natural language.

---

# 🧠 Core Concept

ActoCore provides two main capabilities:

## 1. Q&A Mode (Knowledge Interface)

Users can ask questions about the application, its features, or its data. The system retrieves relevant context and returns accurate answers.

Examples:

- "How does billing work?"
- "What does this feature do?"
- "Show me my last invoices"

---

## 2. Action Mode (Execution Interface)

Users can execute real actions inside the application using natural language.

Examples:

- "Create a new project called Mercivio"
- "Send an invoice to this user"
- "Delete my last workspace"

---

# 🧩 System Architecture

ActoCore is composed of three main layers:

---

## 1. Core (Backend Engine) — Source of Truth

The Core is the central intelligence and execution system.

### Responsibilities:

- LLM communication (OpenAI / Claude)
- Intent classification (Q&A vs Action)
- Tool/action execution system
- RAG (Retrieval Augmented Generation)
- Knowledge base storage & querying
- Session management
- Authentication (API keys, tokens)
- Multi-tenant isolation
- Billing & usage tracking
- Logging & analytics

### Core Principle:

> All intelligence, reasoning, and business logic lives in Core. No other layer contains decision-making logic.

---

## 2. SDK (Client Layer) — Embedded Interface

The SDK is a React-based package embedded inside customer applications.

### Responsibilities:

- Render chat / voice / command UI
- Capture user input
- Send requests to Core API
- Receive AI responses
- Render results inside the host application
- Provide application context (route, user state, metadata)
- Trigger actions returned by Core

### Constraints:

- No business logic
- No AI reasoning
- No direct database access
- No action execution logic

### Purpose:

> Acts as the interface between end users and the Core system inside customer applications.

---

## 3. Studio (Web Dashboard) — Control Plane

The Studio is the SaaS dashboard used by developers integrating ActoCore.

**Documentation:** [`_docs/studio/OVERVIEW.md`](studio/OVERVIEW.md) · [`_docs/studio/ARCHITECTURE.md`](studio/ARCHITECTURE.md) · app: [`apps/studio`](../apps/studio)

### Responsibilities:

- Create and manage applications
- Generate and manage API keys
- Define actions (tools/functions available to AI)
- Upload knowledge base (documents, URLs, files)
- Configure AI behavior (system prompts, rules, tone)
- View logs (requests, actions, errors)
- Monitor usage analytics
- Manage billing and subscriptions

### Constraints:

- No AI execution
- No runtime logic
- No SDK logic

### Purpose:

> Provides full control over how ActoCore behaves inside customer applications.

---

# 🔄 System Flow

---

## 1. End User Flow (SDK → Core)

User interacts inside a customer application:

```text
User
  ↓
SDK (embedded React component)
  ↓
Core API
  ↓
AI Engine:
  - Intent detection (Q&A vs Action)
  - Context processing
  - Tool selection
  ↓
If Q&A Mode:
  - Retrieve knowledge base (RAG)
  - Generate response

If Action Mode:
  - Validate action schema
  - Execute tool/function
  - Return result
  ↓
Response returned to SDK
  ↓
SDK renders result in UI
```
