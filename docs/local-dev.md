# Local Development

## Prerequisites
- Node.js 20 or newer
- Docker running locally for Supabase
- npm

## Install Dependencies
```bash
npm install
```

This repo uses `apps/admin_web` as the Vite frontend. Root scripts proxy into that app so every agent can use the same commands.

## Configure Local Environment
1. Copy `.env.local.example` to `.env.local`.
2. Start Supabase locally.
3. Run `npm run supabase:status`.
4. Replace the placeholder anon and service-role keys in `.env.local` with the local keys shown by the status command.

Do not commit `.env.local`.

## Start Local Supabase
```bash
npm run supabase:start
npm run supabase:status
```

Endpoints:
- API: `http://127.0.0.1:54321`
- Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio: `http://127.0.0.1:54323`
- Inbucket: `http://127.0.0.1:54324`

## Reset Local Database
Requires human approval because this deletes local data.

```bash
npm run supabase:reset
```

The reset loads schema from `schema_dump.sql` and seed data from `supabase/seed.sql`.

## Generate Supabase Types
```bash
npm run supabase:types
```

This writes TypeScript database types to `apps/admin_web/src/lib/database.types.ts`.

## Start the Frontend
```bash
npm run dev
```

## Browser Debugging With Antigravity + Chrome DevTools MCP

Chrome DevTools MCP is accessed through Antigravity.

Default local app URL:

```text
http://localhost:5173
```

Recommended sequence:
1. Start local Supabase.
2. Start the frontend with `npm run dev`.
3. Open `http://localhost:5173` in Chrome through Antigravity.
4. Use Chrome DevTools MCP to inspect console errors, failed network requests, route state, and relevant DOM state.
5. Confirm Supabase traffic targets local `http://127.0.0.1:54321`, not a remote Supabase project.
6. Capture a browser evidence report before asking Codex to edit code.
7. Send the evidence report to Codex.
8. Codex patches the smallest root cause.
9. Run `npm run typecheck` and `npm run build`.
10. Re-test the same browser path through Antigravity.

Evidence to capture:
- route URL
- user action
- expected behavior
- actual behavior
- console errors
- failed request URL/status/method
- Supabase endpoint detected
- relevant DOM/UI state
- files suspected
- recommended next patch

Do not capture, print, or commit secrets from browser storage, environment files, cookies, auth tokens, refresh tokens, or service-role keys.

## Verification
```bash
npm run lint
npm run typecheck
npm run build
```

Or run the combined check:

```bash
npm run check
```

## Multi-Agent Workflow
Create one git worktree per agent and keep each tool on its own branch:

```bash
mkdir -p ../luckystorePOS-agents
git worktree add ../luckystorePOS-agents/codex -b agent/codex
git worktree add ../luckystorePOS-agents/claude -b agent/claude
git worktree add ../luckystorePOS-agents/gemini -b agent/gemini
git worktree add ../luckystorePOS-agents/antigravity -b agent/antigravity
```

Recommended flow:
1. Write the task in `AI_TASKS.md`.
2. Assign one implementation agent to one worktree.
3. Use a second agent only for review.
4. Run verification commands.
5. Merge back manually after review.
