import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockValuationRow {
  item_id: string
  item_name: string
  sku: string | null
  category_name: string | null
  qty_on_hand: number
  unit_cost: number
  unit_price: number
  total_cost: number
  total_value: number
  margin_pct: number
}

export interface TopSellingItem {
  item_id: string
  item_name: string
  sku: string | null
  category_name: string | null
  total_qty: number
  total_revenue: number
  total_profit: number
}

export interface SlowMovingItem {
  item_id: string
  item_name: string
  sku: string | null
  category_name: string | null
  qty_on_hand: number
  total_cost: number
  last_sold_at: string | null
}

export interface DailyMovementTrend {
  trend_date: string
  total_in: number
  total_out: number
  net_delta: number
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getStockValuation(
  storeId: string,
  limit = 100
): Promise<StockValuationRow[]> {
  const { data, error } = await supabase.rpc('get_stock_valuation', {
    p_store_id: storeId,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data || []) as StockValuationRow[]
}

export async function getTopSellingItems(
  storeId: string,
  days = 30,
  limit = 20
): Promise<TopSellingItem[]> {
  const { data, error } = await supabase.rpc('get_top_selling_items', {
    p_store_id: storeId,
    p_days: days,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data || []) as TopSellingItem[]
}

export async function getSlowMovingItems(
  storeId: string,
  days = 30,
  limit = 50
): Promise<SlowMovingItem[]> {
  const { data, error } = await supabase.rpc('get_slow_moving_items', {
    p_store_id: storeId,
    p_days: days,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data || []) as SlowMovingItem[]
}

export async function getDailyMovementTrend(
  storeId: string,
  days = 14
): Promise<DailyMovementTrend[]> {
  const { data, error } = await supabase.rpc('get_daily_movement_trend', {
    p_store_id: storeId,
    p_days: days,
  })
  if (error) throw new Error(error.message)
  return (data || []) as DailyMovementTrend[]
}
