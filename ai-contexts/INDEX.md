# LedgerLite — AI Context Index

## App Identity
- **Name:** LedgerLite → **Clario** (rebrand pending — see PLAN-013)
- **Repo:** E:\GITPRJ\ledger-lite\
- **Production:** https://ledger-lite-mu.vercel.app
- **Portfolio entry:** /explore → demoUrl updated once deployed
- **Purpose:** AI-powered personal finance tracker — works with any bank, any country, no Plaid required

## Quick Status

| Phase | Feature | Status |
|-------|---------|--------|
| P0 | Standalone scaffold (Next.js, Prisma, design system, auth pages, dashboard shell) | ✅ done |
| P1 | Accounts + Categories CRUD, transaction list, live balances | ✅ done |
| P2 | Charts, budgets, dashboard KPIs | ✅ done |
| P3 | Goals, CSV export, recurring transactions, mobile | ✅ done |
| P4 | Demo seed, PWA manifest, keyboard shortcuts | ✅ done |
| P5 | Transaction editing, category management UI, CSV import, recurring UI, net worth KPI, date range reports, danger zone | ✅ done |
| P6 | AI parser (PDF/CSV/XLSX/OFX), Dodo Payments, webhook, entitlements, billing UI, dunning cron, email infra | ✅ done |

**Progress: 7 / 7 phases — FEATURE COMPLETE**

## Actual Build State (audited 2026-05-20)
All of the following are implemented and in production code:

| Layer | File(s) | Status |
|-------|---------|--------|
| AI parser (OpenAI → Claude Haiku → DeepSeek) | `src/lib/ai/parse-document.ts` | ✅ done |
| AI import API + entitlement gate | `src/app/api/v1/import/ai/route.ts` | ✅ done |
| Dodo product ID map + plan lookup | `src/lib/payments/dodo.ts` | ✅ done |
| Checkout session (server-side, intentId-gated) | `src/app/api/v1/checkout/route.ts` | ✅ done |
| Checkout intent API | `src/app/api/v1/checkout-intent/route.ts` | ✅ done |
| Webhook (sig verify + idempotency + ordering + state machine) | `src/app/api/v1/webhooks/dodo/route.ts` | ✅ done |
| Subscription entitlements + AI quota | `src/lib/subscriptions.ts` | ✅ done |
| Billing status API | `src/app/api/v1/billing/route.ts` | ✅ done |
| Billing cancel API | `src/app/api/v1/billing/cancel/route.ts` | ⚠️ verify Dodo API call |
| Billing settings UI | `src/app/(dashboard)/settings/billing/page.tsx` | ✅ done |
| Dunning cron (D3 reminder + grace expiry → free) | `src/app/api/v1/cron/dunning/route.ts` | ⚠️ needs vercel.json cron |
| Email infra (receipt, failed, cancelled, restricted) | `src/infrastructure/email/` | ✅ done |
| Database schema (Subscription + CheckoutIntent + PaymentEvent + EmailLog + FoundingCounter) | `prisma/schema.prisma` | ✅ done |

## Launch Blockers (as of 2026-05-20) — see PLAN-013 for full detail
1. 🔴 `DODO_WEBHOOK_SECRET` missing from Vercel env — **security gap, fix first**
2. 🔴 Pricing inconsistency: landing page vs billing page show different prices
3. 🔴 `/billing/cancel` — verify it calls Dodo API (not DB-only)
4. 🔴 Dunning cron not scheduled in `vercel.json`

## Bug Fix (2026-03-22)
- **Login loop** — `json.data.accessToken` was undefined; AuthSaas wraps tokens under `json.data.tokens.accessToken`.
  Fix: `login-form.tsx` and `auth-client.ts` now read `json.data.tokens ?? json.data` before destructuring.
  Files: `src/components/auth/login-form.tsx`, `src/shared/lib/auth-client.ts`

## Stack
- Next.js 16.1.6, React 19, TypeScript 5
- Tailwind CSS v4 (`@import "tailwindcss"`)
- Prisma 7 + Neon (Postgres)
- Framer Motion 12, Recharts 2, react-countup
- Auth: AuthSaas proxy rewrite `/proxy/auth/*`

## Design System
- Dark-first: `#0f1117` base, `#1a1d27` surface, `#22263a` elevated
- Accent: indigo-500 `hsl(239 84% 67%)`
- Income: green-500, Expense: rose-500
- All monetary text: `ll-mono` class (tabular-nums)
- Card: `ll-card`, Glass modal: `ll-glass`
- Input: `ll-input`

## Key Paths
- Design tokens: `src/app/globals.css`
- Shared types:  `src/shared/types/index.ts`
- Auth client:   `src/shared/lib/auth-client.ts`
- Formatters:    `src/shared/lib/formatters.ts`
- Sidebar:       `src/components/dashboard/sidebar.tsx`
- Auth pages:    `src/app/(auth)/login|register/`
- Dashboard:     `src/app/(dashboard)/`
- Prisma schema: `prisma/schema.prisma`

## Context Files
| File | Load when... |
|------|-------------|
| `project.md` | Starting any work |
| `architecture.md` | Adding routes or features |
| `plan.md` | Planning next phase |
