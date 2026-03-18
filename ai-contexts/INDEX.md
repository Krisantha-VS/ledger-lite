# LedgerLite — AI Context Index

## App Identity
- **Name:** LedgerLite — Personal Finance Tracker
- **Repo:** E:\GITPRJ\ledger-lite\
- **Production:** TBD (Vercel — ledger-lite-xxx.vercel.app)
- **Portfolio entry:** /explore → demoUrl updated once deployed
- **Purpose:** Enterprise-grade personal finance tracker (Next.js showcase)

## Quick Status

| Phase | Feature | Status |
|-------|---------|--------|
| P0 | Standalone scaffold (Next.js, Prisma, design system, auth pages, dashboard shell) | ✅ done |
| P1 | Accounts + Categories CRUD, transaction list, live balances | ✅ done |
| P2 | Charts, budgets, dashboard KPIs | ✅ done |
| P3 | Goals, CSV export, recurring transactions, mobile | ✅ done |
| P4 | Demo seed, PWA manifest, keyboard shortcuts | ✅ done |
| P5 | Transaction editing, category management UI, CSV import, recurring UI, net worth KPI, date range reports, danger zone | ✅ done |

**Progress: 6 / 6 phases — COMPLETE**

**Production:** https://ledger-lite-mu.vercel.app

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
