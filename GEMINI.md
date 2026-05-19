# LuckyStorePOS - Gemini Project Instructions

These foundational mandates take absolute precedence over general workflows.

## 🛡️ Hard Safety Rules

### Security & Credentials
- **NEVER** edit or read `.env`, `.env.local`, or any file containing real credentials/API keys.
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to frontend or mobile code.
- **NEVER** commit access tokens or database passwords.

### Database & Environment
- **NEVER** run `supabase db reset`, `supabase db push`, or `supabase migration up` against real/staging environments without explicit human approval.
- **NEVER** push directly to `main` or force-push.
- **NEVER** bypass RPC inventory mutations or directly modify `stock_levels`.

## 🏗️ Architectural Mandates

### Core Principles
1. **Data Correctness** above all.
2. **Ledger Safety**: Maintain append-only guarantees.
3. **Replay Determinism**: Ensure migrations and operations are idempotent and deterministic.
4. **Consistency**: Preserve `SERIALIZABLE` transaction guarantees.

### Layered Responsibility
- **Frontend**: Rendering, interaction, orchestration.
- **Hooks**: Query management, mutations, optimistic state.
- **Service**: Supabase transport, RPC execution.
- **Database**: Invariants, ledger correctness, RLS enforcement.

## 🔄 Verification Workflows

Run these commands AFTER every change to verify structural and behavioral integrity:

### Admin Web
```bash
cd apps/admin_web && npm run typecheck && npm run build
```

### Mobile App (Flutter)
```bash
cd apps/mobile_app && flutter analyze
```

### System-wide Safety
```bash
npm run check  # Combined suite for distributed safety
```

## 📝 Output Requirements

**Before implementing changes**:
1. Explain the plan.
2. Identify affected invariants and operational/migration risks.

**After implementing changes**:
1. Summarize changed files.
2. Detail operational impact and rollback strategy.
3. Report verification results (commands run and output).

<!-- TOKEN_OPTIMIZER:MODEL_ROUTING -->
## Model & Thinking Routing (by Token Optimizer)
Based on last 30 days: 0% Opus, 0% Sonnet, 0% Haiku.
- Simple edits, grep, formatting: Sonnet, no extended thinking
- Architecture, debugging, synthesis: Opus with thinking
- Subagents for data gathering: Haiku
- Consider Haiku for subagents to reduce cost by 80-90%.
<!-- updated 2026-05-19T19:52 -->
<!-- /TOKEN_OPTIMIZER:MODEL_ROUTING -->
