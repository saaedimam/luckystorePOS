# AGENTS.md
## Project
Lucky Store POS monorepo with a Vite admin app, Supabase backend, scraper scripts, and ops scripts.

## Runtime
- Node.js 20+
- npm with a root `package-lock.json`
- Local Supabase via installed `supabase` CLI
- Local Supabase API: `http://127.0.0.1:54321`
- Local Supabase Studio: `http://127.0.0.1:54323`
- Local Postgres: `127.0.0.1:54322`
- Frontend dev server expected on `3000` or `5173`

## Browser Debugging / Antigravity + Chrome DevTools MCP

Chrome DevTools MCP is accessed through Antigravity.

Use Antigravity for browser-observed debugging when investigating UI, runtime, routing, network, auth, Supabase, storage, or service-worker behavior.

Role split:
- Antigravity observes browser behavior through Chrome DevTools MCP.
- Codex implements minimal code patches from captured evidence.
- A second agent may review the patch if needed.

Allowed Antigravity MCP uses:
- Inspect console errors.
- Inspect failed network requests.
- Inspect request status, method, route, and endpoint origin.
- Inspect DOM/UI state relevant to the bug.
- Inspect local/session storage only for non-secret debugging metadata.
- Capture reproduction steps.
- Verify the same browser path after a patch.

Rules:
- Use browser evidence before editing code for browser-visible bugs.
- Do not infer UI/runtime bugs from source code only when the issue can be reproduced locally.
- Do not inspect, copy, print, or summarize real secrets, access tokens, refresh tokens, service-role keys, payment credentials, cookies, or production credentials.
- Do not use production Supabase during browser debugging.
- Confirm Supabase traffic targets local `http://127.0.0.1:54321`.
- The default local app URL is `http://localhost:5173`.
- Record the route, user action, console error, failed request, status code, endpoint origin, and observed UI behavior.
- Codex should patch only the smallest root cause after evidence is captured.
- After patching, re-test the same browser reproduction path through Antigravity.

## Hard Safety Rules
- Never edit `.env`, `.env.local`, production credentials, or real API keys.
- Never commit service role keys, database passwords, access tokens, OAuth secrets, payment secrets, or scraper credentials.
- Never run `supabase link`, `supabase db push`, or any production migration command without explicit human approval.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to Vite or browser code.
- Never push directly to `main`.
- Never force-push unless explicitly requested.
- Work only in the current branch or worktree.
- Prefer small, reviewable patches over broad rewrites.

## Local Supabase Rules
- Use local Supabase for development.
- Use `npm run supabase:status` to inspect local URLs and generated keys.
- Use `npm run supabase:reset` only with human approval because it is destructive to local data.
- Schema source is `schema_dump.sql`.
- Seed source is `supabase/seed.sql`.
- Commit schema, migration, and seed changes intentionally.

## Verification Commands
Run the available commands after changes when relevant:

```bash
npm run lint
npm run typecheck
npm run build
npm run check
npm run supabase:types
```

If a command is unavailable or fails because the repo is missing prerequisites, report that directly.

## Agent Workflow
1. Read this file first.
2. Inspect `package.json`, `supabase/config.toml`, and `.env.local.example`.
3. State a plan before editing.
4. Modify only files relevant to the task.
5. Run verification.
6. Report changed files, commands run, results, and remaining risks.
