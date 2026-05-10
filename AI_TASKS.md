# AI_TASKS.md
## Current Assignment
Agent:
Branch:
Goal:
Files allowed:
Files forbidden:
Commands allowed:
Verification required:
Expected output:

## Forbidden Files
- `.env`
- `.env.local`
- any file containing real credentials
- production Supabase config
- deployment tokens

## Approval Required
- `supabase db reset`
- `supabase link`
- `supabase db push`
- `git push`
- package upgrades
- deleting files
- broad refactors

## Antigravity Chrome DevTools MCP Smoke Test Template

Agent: Antigravity
Branch: agent/antigravity
App URL: http://localhost:5173
Route: /
User action: first page load
Expected behavior: app loads without fatal console or network errors
Actual behavior:

Goal:
Use Antigravity with Chrome DevTools MCP to inspect first-load browser behavior. Do not edit files.

Files allowed:
- none

Files forbidden:
- `.env`
- `.env.local`
- real credentials
- production Supabase config
- deployment tokens

Commands allowed:
- none unless explicitly requested

Commands requiring approval:
- `supabase db reset`
- `supabase link`
- `supabase db push`
- `git push`
- package installation
- lockfile changes

Required browser evidence:
- route URL
- render status
- console errors
- failed network requests
- detected Supabase endpoint
- local-vs-remote Supabase verdict
- relevant DOM/UI state
- reproduction steps

Expected output:
- browser evidence report
- likely root cause if a blocker exists
- recommended Codex patch
- risks / unknowns
