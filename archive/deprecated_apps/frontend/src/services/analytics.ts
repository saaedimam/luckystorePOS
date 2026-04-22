import { supabase } from './supabase'

export interface LowStockItem {
  item_id: string
  item_name: string
  sku: string | null
  image_url: string | null
  category_name: string | null
  current_qty: number
  min_qty: number
  reorder_qty: number
}

export interface InventorySummary {
  total_skus: number
  out_of_stock_count: number
  total_value: number
  total_cost: number
}

export async function getLowStockItems(storeId: string): Promise<LowStockItem[]> {
  const { data, error } = await supabase.rpc('get_low_stock_items', {
    p_store_id: storeId,
  })
  if (error) throw error
  return (data || []) as LowStockItem[]
}

export async function getInventorySummary(storeId: string): Promise<InventorySummary> {
  const { data, error } = await supabase.rpc('get_inventory_summary', {
    p_store_id: storeId,
  })
  if (error) throw error
  return data as InventorySummary
}

// Save thresholds
export async function saveAlertThreshold(
  storeId: string,
  itemId: string,
  minQty: number,
  reorderQty: number
): Promise<void> {
  const { error } = await supabase
    .from('stock_alert_thresholds')
    .upsert({
      store_id: storeId,
      item_id: itemId,
      min_qty: minQty,
      reorder_qty: reorderQty,
    }, {
      onConflict: 'store_id, item_id'
    })

  if (error) throw error
}

export async function getAlertThreshold(
  storeId: string,
  itemId: string
): Promise<{ min_qty: number; reorder_qty: number } | null> {
  const { data, error } = await supabase
    .from('stock_alert_thresholds')
    .select('min_qty, reorder_qty')
    .eq('store_id', storeId)
    .eq('item_id', itemId)
    .maybeSingle()

  if (error) throw error
  return data
}
