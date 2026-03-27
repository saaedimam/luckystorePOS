import { supabase } from './supabase'

export const ADJUSTMENT_REASONS = [
  { value: 'received', label: 'Received (New Stock)' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost / Theft' },
  { value: 'correction', label: 'Count Correction' },
  { value: 'returned', label: 'Customer Return' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
] as const

export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number]['value']

export interface AdjustStockRequest {
  store_id: string
  item_id: string
  delta: number
  reason: AdjustmentReason
  notes?: string
}

export interface AdjustStockResponse {
  success: boolean
  movement_id: string
  new_qty: number
  delta: number
  reason: string
  error?: string
}

export interface StockMovement {
  id: string
  store_id: string
  item_id: string
  delta: number
  reason: string
  notes: string | null
  meta: Record<string, unknown>
  performed_by: string | null
  performer_name: string | null
  item_name: string
  store_code: string
  created_at: string
}

export async function adjustStock(
  request: AdjustStockRequest,
): Promise<AdjustStockResponse> {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session?.access_token) {
    throw new Error('You are not logged in. Please log in again.')
  }

  const { data, error } = await supabase.functions.invoke('adjust-stock', {
    body: request,
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  })

  if (error) {
    // Try to extract a useful message
    let message = error.message || 'Stock adjustment failed'
    const context = (error as { context?: unknown }).context
    const response = context instanceof Response ? context : undefined
    if (response && typeof response.text === 'function') {
      try {
        const raw = await response.text()
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            message = parsed.error || parsed.message || message
          } catch {
            message = raw
          }
        }
      } catch {
        // keep original
      }
    }
    throw new Error(message)
  }

  return data as AdjustStockResponse
}

export async function getStockMovements(params: {
  storeId?: string
  itemId?: string
  limit?: number
  offset?: number
}): Promise<StockMovement[]> {
  const { data, error } = await supabase.rpc('get_stock_movements', {
    p_store_id: params.storeId ?? null,
    p_item_id: params.itemId ?? null,
    p_limit: params.limit ?? 50,
    p_offset: params.offset ?? 0,
  })

  if (error) throw error
  return (data ?? []) as StockMovement[]
}
