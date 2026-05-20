import { supabase } from '../../lib/supabase';
import { InventoryListRow } from '../../types/rpc';

interface SupabaseClientWithRpc {
  rpc: <T>(name: string, args?: Record<string, unknown>) => Promise<{ data: T | null; error: Error | null }>;
}

export const inventoryService = {
  async getList(storeId: string) {
    if (!storeId) throw new Error("Store ID is required");
    
    const { data, error } = await (supabase as unknown as SupabaseClientWithRpc).rpc<InventoryListRow[]>('get_inventory_list', {
      p_store_id: storeId,
    });

    if (error) throw error;
    return data as InventoryListRow[];
  },

  async getLowStock(storeId: string, limit = 10) {
    if (!storeId) throw new Error("Store ID is required");
    
    const { data, error } = await (supabase as unknown as SupabaseClientWithRpc).rpc('get_low_stock_items', {
      p_store_id: storeId,
      p_limit: limit
    });

    if (error) throw error;
    return data;
  }
};
