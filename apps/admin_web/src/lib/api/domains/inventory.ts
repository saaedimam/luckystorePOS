import { supabase } from '../../supabase';

import { withSerializableRetry } from '../withSerializableRetry';

export const inventory = {
  list: async (storeId: string) => {
    const { data, error } = await supabase.rpc('get_inventory_list', { p_store_id: storeId });
    if (error) throw error;
    return data;
  },
  update: async (tenantId: string, storeId: string, itemId: string, delta: number, reason: string, notes?: string) => {
    return withSerializableRetry(async () => {
      const { data, error } = await supabase.rpc('adjust_stock', {
        p_store_id: storeId,
        p_item_id: itemId,
        p_delta: delta,
        p_reason: reason,
        p_notes: notes || '',
        p_performed_by: tenantId // Assuming tenantId is user id here for RPC context or just omitting if not needed
      });
      if (error) throw error;
      return data;
    });
  },
  set: async (_tenantId: string, storeId: string, itemId: string, newQty: number, reason: string, notes?: string) => {
    return withSerializableRetry(async () => {
      const { data, error } = await supabase.rpc('set_stock', {
        p_store_id: storeId,
        p_item_id: itemId,
        p_new_qty: newQty,
        p_reason: reason,
        p_notes: notes || ''
      });
      if (error) throw error;
      return data;
    });
  },
  history: async (storeId: string, itemId?: string) => {
    const { data, error } = await supabase.rpc('get_stock_movements', {
      p_store_id: storeId,
      p_item_id: itemId || undefined,
      p_limit: 50,
      p_offset: 0
    });
    if (error) throw error;
    return data;
  },
  getSummary: async (storeId: string) => {
    const { data, error } = await supabase.rpc('get_inventory_summary', { p_store_id: storeId });
    if (error) throw error;
    return data;
  },

  // Inventory Analytics RPCs
  getStockValuation: async (storeId: string, limit = 100) => {
    const { data, error } = await supabase.rpc('get_stock_valuation', { p_store_id: storeId, p_limit: limit });
    if (error) throw error;
    return data;
  },
  getTopSellingItems: async (storeId: string, days = 30, limit = 20) => {
    const { data, error } = await supabase.rpc('get_top_selling_items', { p_store_id: storeId, p_days: days, p_limit: limit });
    if (error) throw error;
    return data;
  },
  getSlowMovingItems: async (storeId: string, days = 30, limit = 50) => {
    const { data, error } = await supabase.rpc('get_slow_moving_items', { p_store_id: storeId, p_days: days, p_limit: limit });
    if (error) throw error;
    return data;
  },
  getDailyMovementTrend: async (storeId: string, days = 14) => {
    const { data, error } = await supabase.rpc('get_daily_movement_trend', { p_store_id: storeId, p_days: days });
    if (error) throw error;
    return data;
  },
};