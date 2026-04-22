import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatchStatus = 'active' | 'expired' | 'consumed' | 'recalled'

export interface ItemBatch {
  id: string
  item_id: string
  store_id: string
  batch_number: string
  qty: number
  manufactured_at: string | null
  expires_at: string | null
  notes: string | null
  status: BatchStatus
  po_id: string | null
  created_at: string
  updated_at: string
  item?: { name: string; sku: string | null } | null
  store?: { name: string; code: string } | null
}

export interface ExpiringBatch {
  batch_id: string
  batch_number: string
  item_id: string
  item_name: string
  sku: string | null
  qty: number
  expires_at: string
  days_left: number
  status: BatchStatus
}

export interface AddBatchData {
  storeId: string
  itemId: string
  batchNumber: string
  qty: number
  expiresAt?: string
  manufacturedAt?: string
  notes?: string
  poId?: string
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getBatchesForStore(
  storeId: string,
  status?: BatchStatus,
  limit = 100
): Promise<ItemBatch[]> {
  let query = supabase
    .from('item_batches')
    .select(`
      *,
      item:items(name, sku),
      store:stores(name, code)
    `)
    .eq('store_id', storeId)
    .order('expires_at', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as unknown as ItemBatch[]
}

export async function getExpiringBatches(
  storeId: string,
  days = 30
): Promise<ExpiringBatch[]> {
  const { data, error } = await supabase.rpc('get_expiring_batches', {
    p_store_id: storeId,
    p_days: days,
  })
  if (error) throw new Error(error.message)
  return (data || []) as ExpiringBatch[]
}

export async function addBatch(data: AddBatchData): Promise<string> {
  const { data: batchId, error } = await supabase.rpc('add_batch_and_adjust_stock', {
    p_store_id: data.storeId,
    p_item_id: data.itemId,
    p_batch_number: data.batchNumber,
    p_qty: data.qty,
    p_expires_at: data.expiresAt || null,
    p_manufactured_at: data.manufacturedAt || null,
    p_notes: data.notes || null,
    p_po_id: data.poId || null,
  })
  if (error) throw new Error(error.message)
  return batchId
}

export async function updateBatchStatus(
  batchId: string,
  status: BatchStatus
): Promise<void> {
  const { error } = await supabase
    .from('item_batches')
    .update({ status })
    .eq('id', batchId)
  if (error) throw new Error(error.message)
}
