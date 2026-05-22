# AI Orchestration Service

**Compliant with MASTER_RULES v2026.05.22-v1**

Model router and cost tracking system for Lucky Store POS AI operations.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      TASK INPUT                            │
│  (WhatsApp invoice, catalog update, security review, etc.) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  MODEL ROUTER                               │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────┐       │
│  │  Complexity     │    │  Escalation Triggers     │       │
│  │  Evaluation     │───▶│  - >5 context switches   │       │
│  │                 │    │  - >10 files affected      │       │
│  │  simple         │    │  - Security/architecture   │       │
│  │  moderate       │    │  - User explicit request   │       │
│  │  complex        │    └────────────┬─────────────┘       │
│  │  critical     │                 │                      │
│  └─────────────────┘                 │                      │
│                                      ▼                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    ROUTING DECISION                  │  │
│  │                                                     │  │
│  │   Ollama Cloud (90%)        Gemini (10%)          │  │
│  │   ├─ gemma3:4b              ├─ gemini-2.5-flash   │  │
│  │   ├─ qwen3-coder:480b       └─ gemini-2.5-pro     │  │
│  │   ├─ kimi-k2.5                                     │  │
│  │   └─ kimi-k2-thinking                              │  │
│  │                                                     │  │
│  │   ✓ FREE tier             ✓ PAID tier              │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  COST TRACKER                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Budget: $0-$10/month (MASTER_RULES constraint)     │  │
│  │  Alerts: 80% warning, 95% critical                   │  │
│  │  Tracking: By category, by provider, real-time       │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROVIDER EXECUTION                       │
│                                                             │
│   Ollama Cloud                    Gemini                    │
│   ├─ Generate completion          ├─ Generate content      │
│   ├─ Chat                         ├─ Chat                │
│   ├─ Stream                       ├─ Stream              │
│   └─ Token check                  └─ Token count          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```typescript
import {
  getModelRouter,
  createTask,
  TaskCategories,
  ComplexityLevels,
} from "@/lib/ai";

// Create a task
const task = createTask(
  "task-001",
  TaskCategories.WHATSAPP_INVOICING,
  "Process WhatsApp order from customer",
  {
    complexity: ComplexityLevels.SIMPLE,
    inputTokens: 500,
    expectedOutputTokens: 800,
  }
);

// Route the task
const router = getModelRouter();
const decision = router.route(task);

console.log(decision);
// {
//   provider: "ollama-cloud",
//   model: "gemma3:4b",
//   complexity: "simple",
//   estimatedCost: 0,
//   reason: "Task within Ollama Cloud capabilities (simple complexity)",
//   taskId: "task-001"
// }
```

### Executing Tasks

```typescript
const { result, decision, actualCost } = await router.executeTask(task, {
  data: { orderId: "ORD-123", items: [...] },
});
```

## File Structure

```
src/lib/ai/
├── index.ts          # Main exports
├── types.ts          # TypeScript types & interfaces
├── router.ts         # Core routing logic
├── cost-tracker.ts   # Budget tracking & cost calculation
├── example.ts        # Usage examples
├── README.md         # This file
├── providers/
│   ├── ollama.ts     # Ollama Cloud provider
│   └── gemini.ts     # Gemini provider
└── skills/           # Lucky Store POS Guardian skill system
    ├── index.ts      # Skill barrel export
    ├── runtime-bootstrap.ts  # Agent bootstrap integration
    ├── _core/
    │   ├── types.ts  # Skill phase types
    │   └── runner.ts # Skill registry & runner
    ├── supabase-schema-guardian/  # Skill 1: DB safety
    ├── pos-domain-expert/         # Skill 2: POS workflows
    ├── offline-sync-doctor/       # Skill 3: Offline sync
    └── bangla-localization/       # Skill 4: L10N rules
```

## MASTER_RULES Enforcement

### ✅ Allowed Models

| Model | Provider | Cost | Use Case |
|-------|----------|------|----------|
| `gemma3:4b` | Ollama Cloud | FREE | General tasks, quick answers |
| `qwen3-coder:480b` | Ollama Cloud | FREE | Code generation, refactoring |
| `kimi-k2.5` | Ollama Cloud | FREE | Complex reasoning, architecture |
| `kimi-k2-thinking` | Ollama Cloud | FREE | Deep analysis, debugging |
| `gemini-2.5-flash` | Gemini | PAID | Complex multi-step tasks |
| `gemini-2.5-pro` | Gemini | PAID | Security/architecture reviews |

### ❌ Forbidden Models

| Model | Reason |
|-------|--------|
| Claude API | Strictly prohibited per MASTER_RULES |
| GPT-4 / GPT-4o | Cost exceeds budget |
| Local Ollama (`localhost:11434`) | Prohibited - use Ollama Cloud only |

## Routing Logic

### Escalation Triggers (→ Gemini)

Tasks escalate to Gemini when:

1. **Category-based:**
   - `security-review` → ALWAYS `gemini-2.5-pro`
   - `architecture-review` → ALWAYS `gemini-2.5-pro`

2. **Complexity-based:**
   - >5 context switches
   - >10 files affected
   - User explicitly requests "complex analysis"
   - Task complexity marked as `complex` or `critical`

3. **Default:** Ollama Cloud (90% of tasks)

### Cost Estimation

```typescript
import { getCostTracker } from "@/lib/ai";

const costTracker = getCostTracker();
const estimatedCost = costTracker.calculateCost(
  "gemini-2.5-flash",
  2000, // input tokens
  1500  // output tokens
);
// Returns: ~$1.20
```

### Budget Monitoring

```typescript
const status = router.getBudgetStatus();

console.log(`
  Month: ${status.month}
  Spent: $${status.totalSpent.toFixed(2)}
  Budget: $${status.totalBudget.toFixed(2)}
  Remaining: $${status.remaining.toFixed(2)}
  Used: ${(status.percentageUsed * 100).toFixed(1)}%
`);
```

## Task Categories

```typescript
const TaskCategories = {
  WHATSAPP_INVOICING: "whatsapp-invoicing",
  CATALOG_UPDATE: "catalog-update",
  INVENTORY_SYNC: "inventory-sync",
  ANALYTICS_QUERY: "analytics-query",
  CUSTOMER_SUPPORT: "customer-support",
  DATA_PROCESSING: "data-processing",
  CODE_GENERATION: "code-generation",
  SECURITY_REVIEW: "security-review",      // Always escalates
  ARCHITECTURE_REVIEW: "architecture-review", // Always escalates
};
```

## Error Handling

### Forbidden Model Error

```typescript
try {
  router.validateAllowedModel("claude-opus-4-7");
} catch (error) {
  if (error instanceof ForbiddenModelError) {
    // FORBIDDEN MODEL REQUESTED: "claude-opus-4-7"...
    // This project strictly prohibits Claude API...
  }
}
```

### Budget Exceeded Error

```typescript
try {
  router.route(expensiveTask);
} catch (error) {
  if (error instanceof BudgetExceededError) {
    // Budget exceeded: $10.50 / $10.00
  }
}
```

## Environment Variables

```bash
# Required for Ollama Cloud
VITE_OLLAMA_PRO_API_KEY=your_ollama_cloud_key

# Required for Gemini (escalation only)
VITE_GEMINI_API_KEY=your_gemini_key

# Optional: Monthly budget (default: $10)
VITE_AI_MONTHLY_BUDGET=10

# Optional: API endpoints
VITE_OLLAMA_CLOUD_API_URL=https://api.ollama.ai/v1/
VITE_GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/
```

## Provider Implementation

### Ollama Cloud Provider

```typescript
import { OllamaProvider, createOllamaPrompt } from "@/lib/ai/providers/ollama";

const provider = new OllamaProvider();

// Generate completion
const response = await provider.chat(
  "gemma3:4b",
  [{ role: "user", content: "Hello!" }],
  { temperature: 0.7, maxTokens: 2000 }
);
```

### Gemini Provider

```typescript
import { GeminiProvider, createGeminiPrompt } from "@/lib/ai/providers/gemini";

const provider = new GeminiProvider();

// Generate content
const { text, tokensUsed } = await provider.generate(
  "gemini-2.5-flash",
  "Analyze this data...",
  { temperature: 0.7, maxTokens: 8192 }
);
```

## Compliance Verification

Run the verification script:

```bash
./scripts/dev/agent-verify.sh
```

Expected output:

```
✅ Compliant
Exit code: 0
```

## Stats & Monitoring

```typescript
const stats = router.getStats();

console.log(`
  Total Tasks: ${stats.totalTasks}
  Ollama Tasks: ${stats.ollamaTasks} (FREE)
  Gemini Tasks: ${stats.geminiTasks} (PAID)
  Escalation Rate: ${(stats.escalationRate * 100).toFixed(1)}%
`);

// Target: Escalation rate ≤ 10%
if (stats.escalationRate > 0.1) {
  console.warn("⚠️ Escalation rate exceeds 10% target!");
}
```

## Testing

```bash
# Run examples
npx tsx src/lib/ai/example.ts
```

## Contributing

When adding new features:

1. Ensure MASTER_RULES compliance
2. Add cost tracking for new providers
3. Update escalation thresholds if needed
4. Add examples to `example.ts`
5. Update this README

## Lucky Store POS Guardian — Skill System

Custom agent runtime with domain-specific guardrails for Lucky Store POS.

### Architecture

| Layer | Component | Phase | Action |
|-------|-----------|-------|--------|
| 0 | `types.ts` + `runner.ts` | — | Registration and orchestration |
| 1 | `supabase-schema-guardian` | `PRE_TOOL` | Block dangerous SQL, warn on missing RLS/FK |
| 2 | `pos-domain-expert` | `PRE_PROMPT` + `PRE_TOOL` | Inject checkout rules, warn on direct inserts |
| 3 | `offline-sync-doctor` | `PRE_PROMPT` + `PRE_TOOL` | Enforce Drift/WorkManager, validate retry logic |
| 4 | `bangla-localization` | `PRE_PROMPT` + `PRE_TOOL` | Block RTL, enforce ARB localization |

### Skill System Usage

```typescript
import { processSkills, AgentContext, SkillPhase } from "@/lib/ai";

// Example: PRE_PROMPT processing
const ctx: AgentContext = {
  prompt: "Create a sale checkout flow",
  sessionTokens: 500,
};

const modifiedCtx = await processSkills('PRE_PROMPT', ctx);
// modifiedCtx.prompt now includes injected POS domain rules
```

### Bootstrap Integration

```typescript
import { processSkills } from "@/lib/ai";

async function beforeToolCall(phase, ctx) {
  const results = await processSkills(phase, ctx);
  return results;
}
```

### Skill Rules Summary

**supabase-schema-guardian:**
- Ledger tables (stock_ledger, sales, rider_assignments, rider_earnings): append-only
- Every CREATE TABLE must have ENABLE ROW LEVEL SECURITY
- Every table must have tenant_id FK to tenants(id)

**pos-domain-expert:**
- Checkout: Scan → Cart → RPC → Receipt → Ledger
- All sales RPCs require: operation_id, store_id, tenant_id
- Payment types: CASH | BKASH | SSLCOMMERZ
- Use api.sales.create() RPC — not direct supabase.from(sales).insert()

**offline-sync-doctor:**
- ORM: Drift (SQLite) — never raw sqflite
- Background sync: WorkManager only
- Max retry: 3 — then move to dead_letter_queue
- Conflict resolution: server-wins on stock, client-wins on cart

**bangla-localization:**
- Font: HindSiliguri via Google Fonts
- ARB file: apps/mobile_app/lib/l10n/app_bn.arb
- Currency: ৳ prefix, 2 decimal places — e.g., ৳১২০.০০
- Date format: DD/MM/YYYY
- Bengali is LTR — never apply RTL

## License

Part of Lucky Store POS - Internal Use Only
