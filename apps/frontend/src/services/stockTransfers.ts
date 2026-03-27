import { supabase } from './supabase'

export type StockTransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled'

export interface StockTransfer {
  id: string
  from_store_id: string
  to_store_id: string
  status: StockTransferStatus
  notes: string | null
  created_at: string
  updated_at: string
  from_store?: { name: string; code: string }
  to_store?: { name: string; code: string }
  created_by_user?: { full_name: string }
  items?: StockTransferItem[]
}

export interface StockTransferItem {
  id: string
  transfer_id: string
  item_id: string
  qty: number
  item?: { name: string; sku: string | null }
}

export interface CreateTransferData {
  fromStoreId: string
  toStoreId: string
  notes?: string
  items: { item_id: string; qty: number }[]
}

export async function createStockTransfer(data: CreateTransferData): Promise<string> {
  const { data: id, error } = await supabase.rpc('create_stock_transfer', {
    p_from_store_id: data.fromStoreId,
    p_to_store_id: data.toStoreId,
    p_notes: data.notes || null,
    p_items: data.items,
  })

  if (error) {
    console.error('Failed to create transfer:', error)
    throw new Error(error.message || 'Failed to create stock transfer')
  }

  return id
}

export async function updateStockTransferStatus(
  transferId: string,
  newStatus: StockTransferStatus,
  notes?: string
): Promise<void> {
  const { error } = await supabase.rpc('update_stock_transfer_status', {
    p_transfer_id: transferId,
    p_new_status: newStatus,
    p_notes: notes || null,
  })

  if (error) {
    console.error('Failed to update transfer status:', error)
    throw new Error(error.message || 'Failed to update stock transfer status')
  }
}

export async function getStockTransfers(
  storeId?: string,
  limit = 50,
  offset = 0
): Promise<{ data: StockTransfer[]; count: number }> {
  let query = supabase
    .from('stock_transfers')
    .select(`
      *,
      from_store:from_store_id (name, code),
      to_store:to_store_id (name, code),
      created_by_user:created_by (full_name),
      items:stock_transfer_items(
        id, item_id, qty,
        item:items(name, sku)
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (storeId) {
    // If a store is selected, show transfers either FROM or TO this store
    query = query.or(`from_store_id.eq.${storeId},to_store_id.eq.${storeId}`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to get transfers:', error)
    throw new Error(error.message || 'Failed to load stock transfers')
  }

  return { data: data as unknown as StockTransfer[], count: count || 0 }
}
