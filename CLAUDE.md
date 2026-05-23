# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

LuckyStorePOS is a free, open-source Point of Sale system for Bangladeshi retail. It's a monorepo with four main applications:
- **admin_web**: React + Vite + TypeScript admin dashboard
- **customer_storefront**: Next.js 16 customer-facing storefront
- **mobile_app**: Flutter POS app (offline-first with Drift SQLite)
- **scraper**: Puppeteer-based competitor price monitoring

Backend is Supabase (PostgreSQL 17 + 17 Deno Edge Functions) with tenant-isolated RLS.

## Key Commands

### Admin Web (Primary development surface)
```bash
cd apps/admin_web
npm run dev              # Vite dev server at http://localhost:5173/admin/
npm run build            # Production build (tsc + vite + service worker)
npm run preview          # Preview production build
npm run lint             # ESLint
npm run typecheck        # TypeScript check (from root: npm run typecheck)
```

### Root-level Commands
```bash
npm run dev              # Shortcut to admin_web dev
npm run build            # Shortcut to admin_web build
npm run check            # Lint + typecheck + build
npm run typecheck        # TypeScript check for admin_web

# Supabase (requires Docker for local mode)
npm run supabase:start   # Start local Supabase stack
npm run supabase:stop    # Stop local Supabase stack
npm run supabase:reset   # Reset local DB with migrations
npm run supabase:types   # Generate TypeScript types from DB schema
npm run supabase:sync-remote-data  # Sync data from remote Supabase

# Testing & Verification
npm run safety:test                      # Run safety checks (Node native test runner)
npx ts-node scripts/test-guardian-skill.ts     # Verify Guardian blocks ledger mutations
node scripts/seed-production-data.js          # Seed realistic grocery data (requires local Supabase)

# Operations
npm run scrape                           # Run competitor price scraper
npm run import-competitor                # Import competitor data
npm run remove-duplicates:dry-run        # Preview duplicate removal
npm run remove-duplicates                # Actually remove duplicates

# Governance & Certification
npm run governance:build      # Build governance artifacts
npm run governance:check      # Verify against governance baseline
npm run governance:baseline     # Update governance baseline
npm run governance:certify    # Full governance certification
npm run replay:certify        # Replay certification tests

# Running the App (with driver)
npm run dev                           # Start dev server
cd apps/admin_web && node scripts/driver.mjs screenshot http://localhost:5173/admin/ /tmp/screenshot.png
```

### Development Workflow
```bash
# Start dev server
npm run dev

# Before committing
npm run check           # Runs lint, typecheck, and build
```

### Running Tests
```bash
# Safety checks (Node native test runner)
npm run safety:test

# Run specific test file
node --test scripts/safety/my-test.test.cjs

# TypeScript test file
npx ts-node scripts/test-guardian-skill.ts

# Vitest (admin_web)
cd apps/admin_web && npx vitest run
```

## Architecture

### Monorepo Structure
```
apps/
  admin_web/            # React 19 + Vite 8 + React Router 7 (primary dev surface)
  customer_storefront/  # Next.js 16 + Tailwind v4 (see AGENTS.md for notes)
  mobile_app/           # Flutter 3.29.3 + Provider + Drift (offline-first)
  scraper/              # Node.js + Puppeteer price scraper

supabase/
  functions/            # 17 Deno Edge Functions
  migrations/         # 80+ SQL migrations

.ai/                  # AI command center
  AI_TASKS.md         # Active task queue
  llm_config.json     # Model routing config
  prompts/            # Reusable AI prompts

.vibe/                # Vibe coding workspace
.antigravity/         # IDE integration
.hermes/              # Memory hub (forensics, governance)
```

### State Management Pattern
- **Zustand**: Client-side UI state (cart, drawer toggles, active tabs)
- **TanStack Query**: Server state with caching, mutations, optimistic updates
- **Supabase Realtime**: Live subscriptions for sales notifications

### Offline Strategy (Mobile)
- **Drift SQLite** stores full product catalog, cart, and sales locally
- **WorkManager** handles background sync queue
- **Outbox Pattern**: Mutations queued in `sync_outbox` table, processed oldest-first
- **Conflict Resolution**: Server-authoritative override (server wins on timestamp)
- **Sync Triggers**: Network restore, app foreground, manual pull-to-refresh

Critical: Always generate idempotency keys for mutations to prevent duplicate sales on retry.

### Design System (Admin Web)
- **Warm Anthropic palette**: #f5f4ed background, #c96442 terracotta accent
- **Typography**: Hind Siliguri (Bangla), Inter (Latin), JetBrains Mono (code)
- **CSS Variables**: Defined in `styles/tokens.css`
- **Components**: Custom UI in `components/ui/` (KpiCard, StatusPill, FilterChip, etc.)

## Development Patterns

### React Patterns (from docs/vibe-guides/react-patterns.md)
1. **Functional components only** — no class components
2. **Zustand for UI state**, React Query for server state
3. **No raw async in useEffect** — wrap in useQuery/useMutation
4. **Strict TypeScript** — no `any` allowed
5. **Optimistic updates** for instant UI feedback on mutations

### API Domain Pattern
```typescript
// lib/api/domains/products.ts
export const products = {
  list: async (filters) => { /* RPC call */ },
  create: async (data) => { /* RPC call */ },
  update: async (id, data) => { /* RPC call */ },
  remove: async (id) => { /* RPC call */ },
};
```

### Supabase Patterns
- Use RPCs for complex operations (`record_sale`, `complete_sale_v2`)
- RLS policies on every table for tenant isolation
- Edge Functions for payments (bKash, SSLCommerz), webhooks

## Environment Configuration

### Remote Supabase (Ground Truth)
```bash
# apps/admin_web/.env.local
VITE_SUPABASE_URL=https://hvmyxyccfnkrbxqbhlnm.supabase.co
VITE_SUPABASE_ANON_KEY=<remote_anon_key>
```

### Local Supabase
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>
```

Local seed account: `admin@luckystore.com` / `TempPassword123!`

## AI Infrastructure

See `AGENTS.md` for full agent configuration. Quick reference:

### Graphify (Knowledge Graph)
```bash
/graphify "find auth functions"
/graphify path "User" "AuthController"
/graphify explain "createSale"
```

### Guardian Skill System
Runtime protection in `apps/admin_web/src/lib/ai/skills/`:
- **supabase-schema-guardian**: Blocks UPDATE/DELETE on ledger tables
- **pos-domain-expert**: Enforces checkout flow rules
- **offline-sync-doctor**: Validates sync patterns

**LEDGER_IMMUTABILITY**: `sales_ledger`, `stock_ledger`, `rider_assignments`, `rider_earnings` are append-only. Use compensating transactions to correct errors.

## Important File Locations

| Purpose | Location |
|---------|----------|
| API domains | `apps/admin_web/src/lib/api/domains/*.ts` |
| Zustand stores | `apps/admin_web/src/stores/*.ts` |
| Supabase types | `apps/admin_web/src/lib/database.types.ts` |
| Edge functions | `supabase/functions/*/index.ts` |
| Migrations | `supabase/migrations/*.sql` |
| Guardian skills | `apps/admin_web/src/lib/ai/skills/_core/` |
| Driver script | `apps/admin_web/scripts/driver.mjs` |
| Knowledge graph | `graphify-out/graph.json` |

## Verification

Before marking work complete:
1. Run `npm run typecheck` — must pass
2. Run `npm run build` — must complete without errors
3. Verify UI renders correctly at http://localhost:5173/admin/

## Production Verification

Before major releases, run the full hardening suite:

```bash
# 1. Database seed verification
node scripts/seed-production-data.js
# Expected: 20 products, 5 categories, 3 orders seeded

# 2. Guardian skill verification
npx ts-node scripts/test-guardian-skill.ts
# Expected: 3/3 tests pass (UPDATE blocked, DELETE blocked, SELECT allowed)

# 3. Full build verification
npm run check
# Must pass: 0 TypeScript errors, successful Vite build
```

Reference: `PRODUCTION_READINESS_REPORT.md` at repo root documents the full verification protocol.

## Commit Format

Use conventional commits: `type(scope): message`
- `feat(pos): add split payment support`
- `fix(rls): tighten tenant isolation`
- `docs(readme): update deployment guide`

## Security Notes

- Never commit `.env`, service-role keys, or access tokens
- RLS policies enforce tenant isolation — verify when modifying DB code
- Admin authentication requires both `auth.users` and `public.users` profile
- **Ledger tables are append-only**: `sales_ledger`, `stock_ledger`, `rider_assignments`, `rider_earnings`
  - Never write UPDATE or DELETE queries against these tables
  - Use compensating transactions (insert opposing entry) to correct errors
  - Guardian skills block dangerous operations at runtime

---

*CLAUDE.md Version: 2026.05.23-v5*
*Architecture Reference: ARCHITECTURE.md, AGENTS.md, docs/vibe-guides/*

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
