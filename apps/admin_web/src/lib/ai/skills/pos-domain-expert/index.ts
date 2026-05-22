// Skill 2: pos-domain-expert
// Pain points covered: #1 (wrong flows), #4 (token waste)
// Compliant with MASTER_RULES v2026.05.22-v1

import { registerSkill } from '../_core/runner';

const CONTEXT_INJECT = `
## POS Domain Rules (Lucky Store)
- Checkout: Scan → Cart → RPC → Receipt → Ledger (never direct insert)
- All sales RPCs require: operation_id (UUID), store_id, tenant_id
- Payment types: CASH | BKASH | SSLCOMMERZ
- Offline: queue to IndexedDB → sync via useSyncSales WorkManager path
- Ledger tables (stock_ledger, sales, rider_assignments): APPEND-ONLY
- RLS: every query must scope to tenant_id — no cross-tenant reads
`.trim();

const DIRECT_INSERT_PATTERN = /supabase\.from\(['"]sales['"]\)\.insert/;
const MISSING_OPERATION_ID = /create_sale|process_checkout/;

registerSkill('pos-domain-expert', (phase, ctx) => {
  // Inject context at prompt start for POS-related sessions
  if (phase === 'PRE_PROMPT') {
    const isPOSContext = ctx.prompt.match(
      /sale|checkout|cart|ledger|stock|payment|offline|sync/i
    );
    if (isPOSContext) {
      return { blocked: false, injectedContext: CONTEXT_INJECT };
    }
  }

  if (phase === 'PRE_TOOL') {
    const content = (ctx.toolInput?.content as string) ?? '';

    if (DIRECT_INSERT_PATTERN.test(content)) {
      return {
        blocked: false,
        warning: 'POS_DOMAIN: Use api.sales.create() RPC — not direct supabase.from(sales).insert()'
      };
    }

    if (MISSING_OPERATION_ID.test(content) && !content.includes('operation_id')) {
      return {
        blocked: false,
        warning: 'POS_DOMAIN: operation_id missing — all sale RPCs require idempotency key'
      };
    }
  }

  return { blocked: false };
});
