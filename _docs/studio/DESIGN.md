# ActoCore Studio — Design system

Studio shares the **ActoCore brand** with the embeddable SDK. Colors are defined once as CSS variables and exposed to Tailwind — never hard-code hex in components.

**Source of truth:** [`apps/studio/src/styles/tokens.css`](../../apps/studio/src/styles/tokens.css)  
**Tailwind mapping:** [`apps/studio/tailwind.config.js`](../../apps/studio/tailwind.config.js)

---

## Brand palette

| Token | Light | Role |
|-------|-------|------|
| Primary | `#4f46e5` | CTAs, links, active nav, focus rings |
| Primary hover | `#4338ca` | Hover on primary buttons |
| Secondary | `#7c3aed` | Gradient end, accents |
| Accent | `#a855f7` | Highlights, decorative gradients |

Dark mode shifts primary to `#6366f1` and secondary to `#8b5cf6` for contrast on slate backgrounds.

**Signature gradient:** `from-primary` → `to-secondary` (or utility classes `bg-brand-gradient`, `text-brand-gradient`).

---

## Semantic colors

| Token | Usage |
|-------|--------|
| `background` | Page canvas |
| `surface` / `surface-secondary` | Cards, panels, inputs |
| `border` | Dividers, input outlines |
| `text-primary` / `text-secondary` | Body and muted copy |
| `danger` + `danger-surface` | Errors, destructive actions |
| `success` + `success-surface` | Success states |
| `warning` + `warning-surface` | Warnings |

---

## Tailwind usage

```tsx
// Preferred
<button className="bg-primary hover:bg-primary-hover text-primary-contrast" />
<div className="bg-surface border border-border text-text-primary" />
<h1 className="text-brand-gradient" />

// Brand gradient (headers, marketing shells)
<div className="mesh-bg" />
<div className="bg-brand-gradient-soft" />
```

Do **not** use `blue-500`, `purple-600`, or `gray-*` for product chrome — use semantic tokens above.

---

## Dark mode

`ThemeProvider` toggles `class="dark"` on `<html>`. All tokens have `.dark` overrides in `tokens.css`.

---

## Auth screens

Public routes use **split layout** (`AuthLayout`): brand panel (`mesh-bg` + tagline) on the left (desktop) or top (mobile), form in `AuthCard` on the right.

Routes: `/login`, `/signup`, `/forgot-password`, `/auth/verify-email`, `/auth/reset-password`, `/auth/callback`.

Login supports **account owner** (email + password) and **team member** (workspace ID + username + password). Google OAuth uses `studioAuthApi.redirectToGoogleAuth()` and returns to `/auth/callback`.

---

## SDK alignment

Embed widget tokens live in `packages/sdk/src/styles/tokens.css`. Studio dashboard tokens use the same **primary indigo** and **violet secondary** so tenant-configured SDK themes feel consistent with the control plane.

---

## Related

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`_docs/RULES.md`](../RULES.md) § Styling
