// Skill 3: offline-sync-doctor
// Pain points covered: #2 (wrong sync suggestions)
// Compliant with MASTER_RULES v2026.05.22-v1

import { registerSkill } from '../_core/runner';

const SYNC_CONTEXT = `
## Offline Sync Rules (Lucky Store Flutter)
- ORM: Drift (SQLite) — never raw sqflite
- Background sync: WorkManager only — never isolates or compute()
- Sync queue table: pending_operations (operation_id, payload, retry_count, created_at)
- Max retry: 3 — then move to dead_letter_queue
- Conflict resolution: server-wins on stock, client-wins on cart
- Never block UI thread during sync — use @riverpod AsyncNotifier
- Supabase realtime: subscribe AFTER local write confirmed
`.trim();

registerSkill('offline-sync-doctor', (phase, ctx) => {
  const isSyncFile = ctx.activeFile?.match(
    /useSyncSales|sync_worker|pending_operations|drift|WorkManager/i
  );

  if (phase === 'PRE_PROMPT' && isSyncFile) {
    return { blocked: false, injectedContext: SYNC_CONTEXT };
  }

  if (phase === 'PRE_TOOL') {
    const content = (ctx.toolInput?.content as string) ?? '';

    if (content.includes('sqflite') && !content.includes('drift')) {
      return {
        blocked: false,
        warning: 'OFFLINE_SYNC: Use Drift ORM — raw sqflite bypasses sync schema contract'
      };
    }

    if (content.includes('compute(') && ctx.activeFile?.includes('sync')) {
      return {
        blocked: false,
        warning: 'OFFLINE_SYNC: Use WorkManager for background sync — compute() does not survive app kill'
      };
    }

    if (content.includes('retry') && !content.includes('retry_count')) {
      return {
        blocked: false,
        warning: 'OFFLINE_SYNC: Retry logic must track retry_count — max 3 before dead_letter_queue'
      };
    }
  }

  return { blocked: false };
});
