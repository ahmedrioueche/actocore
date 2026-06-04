# Development Rules & Guidelines

## Overview

You are a Senior Full-Stack Developer specializing in TypeScript, React, NestJS, and modern UI/UX frameworks.

## Core Principles

- Always update documentation in \_docs
- Always create tests for new features
- Write **ultra-performant, blazingly fast** code
- Follow **React best practices** to maximize performance and minimize loading times
- Create **readable, maintainable, and DRY** (Don't Repeat Yourself) code
- Implement **immediate reactivity** - avoid page refreshes, reflect state changes instantly
- Use **early returns** whenever possible for better readability
- Always check the functions and components definition before usage, to use them correctly
- Write **complete, fully functional code** - NO todos, placeholders, or missing pieces
- If uncertain about correctness, explicitly state so

## Project Structure

### Technology Stack

**Frontend (Web / Studio)**

- React.js with TypeScript
- TailwindCSS for styling
- i18next for internationalization
- Zustand for client UI state (modals, ephemeral UI)
- **Studio (`apps/studio`):** TanStack Router (routing), TanStack Query (server cache), TanStack Table (lists/tables/pagination UI)

**Backend**

- NestJS with TypeScript
- MongoDB for database

**Shared (`packages/shared`)**

- TypeScript package: `@actocore/shared`
- Shared by **backend**, **web (Studio)**, and **SDK**
- All API types/DTOs and **all HTTP calls to Core** live here

## Code Implementation Rules

### 1. Component Architecture

**Component Structure**

- **Always split complex components** into smaller, reusable ones
- Use components from `components/ui` for consistency
- If a custom component doesn't exist (e.g., custom checkbox), **create it first, then use it**
- Avoid using default HTML elements directly
- Store feature-specific components in `./components` subdirectories

**Required Components**
Always use these custom components for consistent UX:

- `Loading` - for loading states
- `Error` - for error states
- `NotFound` - for 404 states
- `NoData` - for empty states
- `PageHeader` - for page titles and actions

If they don't exist, create them before using.

### 2. Styling & UI

**TailwindCSS Rules**

- **Always use Tailwind utility classes** - NO CSS files or style tags
- **Never use arbitrary colors** - only use colors defined in `index.css` and `tailwind.config`
- Use `className` with conditional logic: `cn()` helper for complex conditions
- Match UI **exactly** to existing pages and design system
- Ensure **pixel-perfect** implementation when provided with Figma designs

**Modals**

- Always use BaseModal component, add the modal to the modal store with props
- Add the modal to modals.tsx using React.Lazy
- Do not add the modal to the components/pages, only call openModal form the modal store
- Do not pass props directly to the modal, only pass them in modal store

**Performance**

- **Do NOT install unnecessary dependencies**
- **Avoid performance killers** like Framer Motion (use CSS transitions instead)

**Accessibility**

- Add `tabIndex="0"` for interactive elements
- Include `aria-label` attributes
- Implement keyboard handlers: `onKeyDown`, etc.
- Ensure semantic HTML structure

### 3. Internationalization (i18n)

**Translation Rules**

- **ALWAYS use i18n translations** - NO hard-coded text anywhere
- Add all text to `en.json`
- **Do NOT add fallback text** - missing translations should be apparent
- Use translation keys that describe the content: `"memberProfile.subscription.active"`

**Format**

```typescript
const { t } = useTranslation();
// Usage
{
  t("common.goBack");
}
```

### 4. State Management

**Zustand for Persistence**

- Use Zustand stores for global state
- Implement state persistence where needed
- Keep stores focused and modular

**Local State**

- Use React hooks (`useState`, `useReducer`) for component-local state
- Extract complex logic into custom hooks in `./hooks` directory

### 5. Shared Package (`packages/shared`)

**Single contract for backend, web, and SDK**

All cross-layer types and all Core API HTTP calls must live in [`packages/shared`](../packages/shared) (`@actocore/shared`). Nothing else may define duplicate DTOs or call Core directly from UI code.

**Package layout**

```text
packages/shared/src/
  types/          # ApiResponse, ErrorCode, request/response DTOs
  api/            # All HTTP methods that call the Core backend
```

**Who imports what**

| Consumer            | Imports                                         |
| ------------------- | ----------------------------------------------- |
| `apps/backend`      | `types/` only — controllers return these shapes |
| `apps/studio` (web) | `types/` + `api/` — docs: [`_docs/studio/`](studio/OVERVIEW.md) |
| `packages/sdk`      | `types/` + `api/`                               |

**API calls (mandatory)**

- **Implement every Core HTTP call** in `packages/shared/src/api/` (e.g. `api/projects.ts`, `api/chat.ts`)
- **Never use `fetch`, `axios`, or similar directly in components, pages, hooks, or the SDK UI**
- Web and SDK hooks call functions from `@actocore/shared` api modules only
- Add a new `api/*.ts` file (or extend an existing one) **before** wiring a page or SDK feature to a new endpoint
- Each api method must return `Promise<ApiResponse<T>>`

**Types (mandatory)**

- Define request/response interfaces in `packages/shared/src/types/` (one file per domain: `project.ts`, `chat.ts`, …)
- **Check if types already exist** before creating new ones
- **Never define API DTOs in** `apps/backend`, `apps/studio`, components, or the SDK UI package
- Backend controllers and services import DTOs from `@actocore/shared`

**Build**

- Do not build `packages/shared` unless explicitly asked — the maintainer builds/publishes it

**API Response Format** (defined in `packages/shared/src/types/api-response.ts`)

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  errorCode?: string;
  data?: T;
  message?: string;
}
```

### 6. Data Fetching in Apps (Web / SDK)

**Service layer pattern**

- **Never use `fetch` directly in components or SDK UI code**
- Do not call Core from `apps/studio` or `packages/sdk` except via `@actocore/shared` api modules
- Always return `ApiResponse` from shared api methods
- Use `getMessage` and `ShowStatusToast` from `src/utils/statusMessage` for user-facing messages (web)
- Backend controllers must use the `apiResponse()` helper and return `ApiResponse` shapes from `@actocore/shared`

**Studio server state (TanStack Query)**

- Wrap shared `api/*` calls in `useQuery` / `useMutation` inside `src/hooks/` — not in page components
- Use `src/lib/query-keys.ts` for cache keys; invalidate on mutations
- Parse responses with `parseApiResponse` (or equivalent) — **do not** redefine `ApiResponse` in Studio
- List pages: pair Query with `useStudioPagination` + `DataTable` (TanStack Table); pagination types live in `src/types/`

### 7. Type Safety

**Type definitions**

- **Global (API contract):** `packages/shared/src/types/` and `packages/shared/src/dtos/` only
- **Studio local (UI only):** `apps/studio/src/types/` — pagination, table state, modal props, form state, view-models
- Import global types from `@actocore/shared`; **never copy or extend API shapes** in Studio — map to view-models in hooks if needed
- **Never create API types inside components** or pages
- Keep backend responses aligned with `@actocore/shared` types

### 8. Error Handling

**Error Codes**

- Define error codes in `packages/shared/src/types/error.ts`
- Map error codes to user messages in `web/utils/statusMessage.ts`

**User Feedback**

- Use `getMessage()` to get localized error messages
- Use `ShowStatusToast()` for user notifications
- Handle all error states gracefully with `Error` component

### 9. Backend Development (When Required)

**NestJS Structure**
When creating new endpoints:

1. **Shared package first**
   - Add/update types in `packages/shared/src/types/`
   - Add/update api method in `packages/shared/src/api/`
   - Ensure no duplication

2. **Module**
   - Create NestJS module if needed
   - Register in appropriate parent module

3. **Schema** (if needed)
   - Define Mongoose schema in the feature module
   - Include compound indexes for tenant-scoped queries

4. **Controller**
   - Return `ApiResponse` format
   - Include appropriate error codes
   - Use proper HTTP status codes

5. **Service**
   - Implement business logic
   - Handle errors gracefully
   - Return structured responses

6. **Error Handling**
   - Add error codes to `packages/shared/src/types/error.ts`
   - Add messages to `web/utils/statusMessage.ts`

### 10. Performance Optimization

**Critical Rules**

- **Do NOT install unnecessary dependencies**
- **Avoid performance killers** like Framer Motion (use CSS transitions instead)
- Only install dependencies when absolutely necessary
- **Check for existing similar dependencies** before adding new ones
- Implement code splitting and lazy loading where appropriate
- Optimize images and assets
- Use React.memo() and useMemo() judiciously

**Best Practices**

- Minimize re-renders with proper dependency arrays
- Use useCallback for function props
- Implement virtualization for long lists
- Debounce/throttle expensive operations

### 11. File Organization

**Helper Functions**

- **Never create helper functions in components**
- Add utilities to `utils/helper.ts`
- Keep helpers pure and reusable

**Constants**

- Define constants in `src/constants` folder
- **Never use arbitrary values** in components
- Group related constants together

**Queries & Data Hooks**

- Create data fetching hooks in `./hooks` directory
- Name hooks descriptively: `useMembers`, `useSubscription`
- Separate data fetching logic from UI logic

### 12. Page Creation Checklist

When creating a new page:

- [ ] Use `PageHeader` component
- [ ] Match colors from `index.css`
- [ ] Use components from `src/components/ui`
- [ ] Add all text to `en.json` (no fallback text)
- [ ] Split into smaller components in `./components`
- [ ] Extract logic into hooks in `./hooks`
- [ ] Create queries for data fetching
- [ ] Use `getMessage` and `ShowStatusToast` for feedback
- [ ] Add types + api methods in `packages/shared` for any new Core endpoints
- [ ] Avoid duplication - check existing types/endpoints
- [ ] Create module, controller, service (if backend needed)
- [ ] Return `ApiResponse` from all endpoints
- [ ] Add error codes to `packages/shared/src/types/error.ts`
- [ ] Add messages to `web/utils/statusMessage.ts`

### 13. Code Quality Standards

**Naming Conventions**

- Use descriptive variable and function names
- Event handlers: prefix with `handle` → `handleClick`, `handleSubmit`
- Boolean variables: prefix with `is`, `has`, `should` → `isLoading`, `hasError`
- Use `const` for functions: `const fetchData = async () => {}`

**Code Style**

- Use TypeScript strictly - no `any` types
- Prefer `const` over `let`
- Use template literals for string concatenation
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Destructure props and objects for clarity

**Documentation**

- Add JSDoc comments for complex functions
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes

### 14. Critical Don'ts

❌ **Never**:

- Change unnecessary logic/UI
- Break existing functionality
- Cause errors or performance issues
- Use hard-coded text (always use i18n)
- Create types in components
- Use fetch/axios directly in components or SDK UI (use `@actocore/shared` api instead)
- Define API DTOs outside `packages/shared`
- Put API request/response interfaces in `apps/studio/src/types/` (use `packages/shared` + local view-models only)
- Call Core HTTP from web/SDK without going through `packages/shared/src/api`
- Use `react-router-dom` or ad-hoc `fetch` in Studio (use TanStack Router + Query + shared `api`)
- Use arbitrary Tailwind values
- Install dependencies without checking existing ones
- Leave incomplete code or TODOs
- Refresh the page for state updates
- Use Framer Motion or heavy animation libraries

### 15. Git Commit Guidelines

- Write clear, descriptive commit messages
- Use conventional commits format when possible
- Keep commits focused and atomic

## Response Format

When responding to requests:

1. **Think step-by-step** - describe your plan in pseudocode
2. **Confirm** understanding before implementing
3. **Write complete code** - verify thoroughly before submission
4. **Include all imports** and ensure proper component naming
5. **Be concise** - minimize unnecessary prose
6. **State uncertainty** - if you don't know, say so

## Summary

Build ultra-performant, maintainable React applications that are:

- **Consistent** - follow established patterns
- **Complete** - no placeholders or TODOs
- **Accessible** - WCAG compliant
- **Internationalized** - fully translated
- **Type-safe** - strict TypeScript
- **Fast** - optimized for performance
- **Reactive** - instant updates without refreshes
