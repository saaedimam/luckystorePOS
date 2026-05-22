// Skill 1: supabase-schema-guardian
// Pain points covered: #1 (RLS/ledger), #4 (token waste from repeated rule reminders)
// Compliant with MASTER_RULES v2026.05.22-v1

import { registerSkill } from '../_core/runner';

const LEDGER_TABLES = ['stock_ledger', 'rider_assignments', 'rider_earnings', 'sales'];
const DANGEROUS_OPS = ['UPDATE', 'DELETE FROM', 'DROP TABLE', 'TRUNCATE'];

registerSkill('supabase-schema-guardian', (phase, ctx) => {
  if (phase !== 'PRE_TOOL') return { blocked: false };

  const isSQL = ctx.activeFile?.includes('supabase/migrations/')
    || ctx.toolInput?.content?.toString().includes('CREATE TABLE');

  if (!isSQL) return { blocked: false };

  const content = (ctx.toolInput?.content as string) ?? '';

  // Ledger immutability
  for (const table of LEDGER_TABLES) {
    for (const op of DANGEROUS_OPS) {
      if (content.includes(`${op} ${table}`) || content.includes(`${op} public.${table}`)) {
        return {
          blocked: true,
          reason: `LEDGER_IMMUTABILITY: ${op} on ${table} is forbidden. Use append-only offset rows.`
        };
      }
    }
  }

  // RLS guard
  const hasCreateTable = content.includes('CREATE TABLE');
  const hasRLS = content.includes('ENABLE ROW LEVEL SECURITY');
  if (hasCreateTable && !hasRLS) {
    return {
      blocked: false,
      warning: 'RLS_MISSING: New table detected without ENABLE ROW LEVEL SECURITY + policy.'
    };
  }

  // tenant_id FK guard
  const hasTable = content.includes('CREATE TABLE');
  const hasTenantFK = content.includes('REFERENCES tenants(id)');
  if (hasTable && !hasTenantFK) {
    return {
      blocked: false,
      warning: 'TENANT_ISOLATION: No tenant_id FK to tenants(id) found. Verify isolation.'
    };
  }

  return { blocked: false };
});
