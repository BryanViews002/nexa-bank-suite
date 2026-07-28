# Prompt — Maximum UI Upscale, Nexa Bank Suite

> Paste this as-is into Claude Code from the repo root.
> Run with permissions pre-granted: `claude --permission-mode acceptEdits`
> (or press `Shift+Tab` in-session to reach **accept-edits**, or `--dangerously-skip-permissions` in a sandbox).

---

## Role

You are a senior product designer *and* front-end engineer. Take the Nexa Bank
Suite UI from "good" to the absolute ceiling of what a fintech product can look
and feel like — the standard is Stripe, Linear, Mercury, Ramp, Monzo. Every
screen should look intentional, dense with signal, and shippable to a real
banking customer today.

## Hard constraint — the backend is frozen

This is a **presentation-layer-only** change. The Spring Boot backend at
`http://localhost:8080` must keep working byte-for-byte identically.

**Do not change, under any circumstances:**

- Any endpoint path, HTTP verb, request payload shape, or query parameter.
  The full surface in use is:
  `/login`, `/register`, `/auth/logout`, `/auth/get-otp`, `/auth/verify-otp`,
  `/auth/request-password-reset`, `/auth/confirm-password-reset`,
  `/accounts`, `/accounts/open`, `/accounts/{id}/mini-statement`,
  `/transactions`, `/transactions/transfer`, `/transactions/deposit`,
  `/transactions/withdraw`, `/users/me`, `/user/profile`, `/users/profile`,
  `/users/search`
- The `src/lib/api.ts` contract — `API_BASE`, `apiUrl`, `withCredentials`,
  `jsonPost`, `readError`. Cookie sessions mean every call keeps
  `credentials: "include"`.
- The response-parsing and field names the components read off the JSON
  (`transactionId`, `accountId`, `balance`, `type`, `date`, `fullName`, …),
  including the `/users/me` → `/user/profile` → `/users/profile` fallback chain.
- Auth/session/routing semantics: which route redirects where, what OTP
  purposes exist, when a session is considered invalid.
- Business logic: balance math, credit/debit classification, filter/sort
  predicates, CSV export columns.

If a visual improvement seems to require a backend change, **do it client-side
or skip it** and note it at the end. Derive, never invent: no fabricated data,
no fake numbers, no placeholder balances shown as if real.

## Scope — what to maximize

### 1. Design system (`src/index.css`, `tailwind.config.ts`)
Deepen the existing HSL token system rather than replacing it. Keep dark as
default and full light-mode parity.
- A real type scale with optical tracking; keep the tabular-numerals rule for
  every money figure — non-negotiable.
- Elevation as a coherent ladder (surface → raised → overlay), not ad-hoc shadows.
- One motion system: shared easing, a small set of durations, and a full
  `prefers-reduced-motion` path that actually disables transforms.
- State styling that is complete everywhere: hover, active, focus-visible,
  disabled, loading, error, empty.

### 2. Landing (`src/pages/Landing.tsx`, `components/marketing/`, `components/visual/`)
Maximize the marketing surface: hero, capability grid, trust/security flow,
product preview, and a real footer. Keep the three.js `NexaScene` but make sure
it degrades gracefully — no layout shift, no jank, disabled under reduced-motion,
and never blocking first paint.

### 3. Auth flow (`Login`, `Register`, `ResetPassword`, `Otp`, `layout/AuthLayout`)
Make these feel like a bank you'd trust with money: a considered split layout,
inline validation with live feedback, password-strength affordance, clear OTP
entry with paste support and resend timing, and precise error surfaces.
Preserve every existing submit handler and payload exactly.

### 4. Dashboard (`src/pages/Dashboard.tsx` — 771 lines — + `components/dashboard/`)
This is the core product. Push hardest here.
- Overview: balance hierarchy, trend, month-to-date in/out, sparklines.
- Accounts: cards that read as real financial instruments.
- Move money: transfer / deposit / withdraw with a confident review step.
- Transactions: a dense, scannable, sortable ledger with strong filters,
  readable empty and loading states, and the existing CSV export intact.
- Charts (`components/charts/balance-chart.tsx`): axis, grid, and tooltip
  styling that reads as one system with the rest of the UI.

Refactoring `Dashboard.tsx` into presentational subcomponents is encouraged —
but the data fetching, state, and effects must keep behaving identically.

### 5. Craft pass
- Accessibility: semantic landmarks, labelled controls, visible focus, adequate
  contrast in both themes, `aria-live` for async results, keyboard-complete flows.
- Responsive from 320px to ultrawide, with a genuinely good mobile dashboard.
- Loading: skeletons that match final layout so nothing jumps.
- Consistency: one button system, one input system, one card system — no
  one-off Tailwind soup at call sites.

## Method

1. Read the existing files before editing; match the established comment style
   and token naming — this codebase already has real taste, extend it.
2. Work screen by screen. After each screen, run `npx tsc --noEmit` and
   `npm run build`, and fix what you break before moving on.
3. Reuse the shadcn/Radix primitives already installed; add a dependency only
   if genuinely necessary.
4. Keep every route, prop contract, and handler name that other files import.

## Definition of done

- `npm run build` and `npx tsc --noEmit` both pass clean.
- `npm run lint` shows no new errors.
- Every route renders: `/`, `/login`, `/register`, `/reset-password`, `/otp`,
  `/dashboard`, and a 404.
- Light and dark both look deliberate.
- Not one network call, payload, or field name changed.
- Finish with a short report: what changed per screen, and anything deliberately
  left out.
