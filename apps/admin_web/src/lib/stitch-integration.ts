import { supabase } from './supabase';

export interface InventorySnapshot {
  item_id: string;
  item_name: string;
  sku: string;
  current_qty: number;
  min_qty: number;
  reorder_qty: number;
}

/**
 * Stage 1: Compute inventory snapshot by querying database for low stock items.
 * Scoped by storeId for multi-tenant isolation.
 */
export async function computeInventorySnapshot(
  storeId: string,
  itemIds?: string[]
): Promise<InventorySnapshot[]> {
  const { data, error } = await supabase.rpc('get_low_stock_items', {
    p_store_id: storeId,
  });

  if (error) {
    console.error('[StitchSync] Error fetching stock snapshot:', error);
    throw error;
  }

  const snapshot = (data || []).map((item: { item_id: string; item_name: string; sku?: string; current_qty: number; min_qty?: number; reorder_qty?: number }) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    sku: item.sku || 'N/A',
    current_qty: Number(item.current_qty),
    min_qty: Number(item.min_qty || 5),
    reorder_qty: Number(item.reorder_qty || 20),
  })) as InventorySnapshot[];

  if (itemIds && itemIds.length > 0) {
    return snapshot.filter((item) => itemIds.includes(item.item_id));
  }

  return snapshot;
}

/**
 * Stage 2: Persist the inventory snapshot to a (mocked) Google Sheet via Stitch MCP.
 * Implements a 10-minute time-bucketed idempotency key to prevent double logging.
 */
export async function persistInventorySnapshot(
  snapshot: InventorySnapshot[]
): Promise<{ success: boolean; rowsAdded: number }> {
  const tenMinBucket = Math.floor(Date.now() / (1000 * 60 * 10));
  let rowsAdded = 0;

  for (const item of snapshot) {
    const idempotencyKey = `sheets-sync:${item.item_id}:${tenMinBucket}`;

    // Deduplication check
    const isSynced = localStorage.getItem(idempotencyKey);
    if (isSynced) {
      console.log(`[StitchSync] SKU: ${item.sku} already persisted to Sheets in this bucket. Skipping.`);
      continue;
    }

    // Mock the Google Stitch Sheets appendRow call
    console.log(
      `[StitchSync] Google Sheets appendRow: [${new Date().toISOString()}] Store ID: ${item.item_id}, Name: ${item.item_name}, SKU: ${item.sku}, Qty: ${item.current_qty}, Reorder Qty: ${item.reorder_qty}`
    );

    localStorage.setItem(idempotencyKey, 'synced');
    rowsAdded++;
  }

  return { success: true, rowsAdded };
}

/**
 * Stage 3: Send Gmail alerts to the store manager (Mohammed) via Stitch MCP.
 * Uses a pre-filled procurement template and is rate-limited using a 10-minute idempotency bucket.
 */
export async function triggerLowStockAlerts(
  snapshot: InventorySnapshot[]
): Promise<{ success: boolean; emailsSent: number }> {
  let emailsSent = 0;
  const criticalItems = snapshot.filter((item) => item.current_qty <= item.min_qty);

  if (criticalItems.length === 0) {
    return { success: true, emailsSent: 0 };
  }

  const tenMinBucket = Math.floor(Date.now() / (1000 * 60 * 10));

  for (const item of criticalItems) {
    const emailKey = `email-alert:${item.item_id}:${tenMinBucket}`;

    const isAlerted = localStorage.getItem(emailKey);
    if (isAlerted) {
      console.log(`[StitchSync] Gmail alert already sent for SKU: ${item.sku} in this bucket. Skipping.`);
      continue;
    }

    // Pre-filled email procurement template
    const templateBody = `
Dear Mohammed,

CRITICAL PROCUREMENT ALERT:
The stock level for the item "${item.item_name}" (SKU: ${item.sku}) has fallen to ${item.current_qty}.
This is at or below the reorder point of ${item.min_qty}.

Suggested procurement reorder quantity: ${item.reorder_qty} units.

Please trigger the quick restock action in your Stitch control tower immediately.

Best regards,
LuckyStorePOS Autonomous Agent (Stitch Integration)
    `.trim();

    // Mock the Google Stitch Gmail sendEmail call
    console.log(
      `[StitchSync] Gmail sendEmail: Sending to mohammed@luckystore.com for SKU: ${item.sku}\n`,
      templateBody
    );

    localStorage.setItem(emailKey, 'sent');
    emailsSent++;
  }

  return { success: true, emailsSent };
}

/**
 * Orchestrator: Asynchronous best-effort sync wrapper that fails gracefully without blocking the UI path.
 */
export async function StitchSyncInventory(
  storeId: string,
  itemIds?: string[]
): Promise<void> {
  if (!storeId) return;

  // Run in background as an async side-effect
  (async () => {
    try {
      console.log(`[StitchSync] Executing background sync for store: ${storeId}`);
      const snapshot = await computeInventorySnapshot(storeId, itemIds);
      if (snapshot.length === 0) {
        console.log('[StitchSync] No critical inventory needs at this moment.');
        return;
      }

      const sheetRes = await persistInventorySnapshot(snapshot);
      const emailRes = await triggerLowStockAlerts(snapshot);

      console.log(
        `[StitchSync] Finished background tasks. Sheets: ${sheetRes.rowsAdded} logged, Emails: ${emailRes.emailsSent} sent.`
      );
    } catch (error) {
      console.warn('[StitchSync] Background sync failed gracefully (Manual Procurement Mode active):', error);
    }
  })();
}
