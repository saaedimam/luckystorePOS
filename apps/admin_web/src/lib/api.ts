import { supabase } from './supabase';
import { mapSearchItems, mapCategories } from './api/mappers';
import type { PosProduct, PosCategory, SaleResult } from './api/types';

const DEBUG_POS = import.meta.env.VITE_DEBUG_POS === 'true';

function debugLog(label: string, data: any) {
  if (DEBUG_POS) {
    console.log(`[POS API] ${label}:`, JSON.stringify(data, null, 2));
  }
}

export const api = {
  dashboard: {
    getStats: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_manager_dashboard_stats', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
    getLowStock: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_low_stock_items', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
  },
  products: {
    list: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*, categories(name)')
        .order('name');
      if (error) throw error;
      return data;
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('items').select('*, categories(*)').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    create: async (product: any) => {
      const { data, error } = await supabase.from('items').insert([product]).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
  },
  categories: {
    list: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  },
  inventory: {
    list: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_inventory_list', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
    update: async (storeId: string, itemId: string, delta: number, reason: string, notes?: string, idempotencyKey?: string) => {
      const { data, error } = await supabase.rpc('adjust_stock', {
        p_store_id: storeId,
        p_item_id: itemId,
        p_delta: delta,
        p_reason: reason,
        p_notes: notes,
        p_idempotency_key: idempotencyKey
      });
      if (error) throw error;
      return data;
    },
    set: async (storeId: string, itemId: string, newQty: number, reason: string, notes?: string) => {
      const { data, error } = await supabase.rpc('set_stock', {
        p_store_id: storeId,
        p_item_id: itemId,
        p_new_qty: newQty,
        p_reason: reason,
        p_notes: notes
      });
      if (error) throw error;
      return data;
    },
    history: async (storeId: string, itemId?: string) => {
      const { data, error } = await supabase.rpc('get_stock_history_simple', {
        p_store_id: storeId,
        p_item_id: itemId
      });
      if (error) throw error;
      return data;
    },
    getSummary: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_inventory_summary', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
  },
  sales: {
    history: async (storeId: string, search?: string, startDate?: string, endDate?: string) => {
      const { data, error } = await supabase.rpc('get_sales_history', {
        p_store_id: storeId,
        p_search_query: search,
        p_start_date: startDate,
        p_end_date: endDate
      });
      if (error) throw error;
      return data;
    },
    getDetails: async (saleId: string) => {
      const { data, error } = await supabase.rpc('get_sale_details', { p_sale_id: saleId });
      if (error) throw error;
      return data;
    },
    void: async (saleId: string, reason: string, idempotencyKey?: string) => {
      const { data, error } = await supabase.rpc('void_sale', {
        p_sale_id: saleId,
        p_reason: reason,
        p_idempotency_key: idempotencyKey
      });
      if (error) throw error;
      return data;
    },
  },
  settings: {
    getPaymentMethods: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_payment_methods', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
    getUsers: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_store_users', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
    getReceiptConfig: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_receipt_config_simple', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
    updateReceiptConfig: async (storeId: string, config: any) => {
      const { data, error } = await supabase.rpc('update_receipt_config_simple', {
        p_store_id: storeId,
        p_store_name: config.store_name,
        p_header_text: config.header_text,
        p_footer_text: config.footer_text
      });
      if (error) throw error;
      return data;
    },
  },

  // ---------------------------------------------------------------------
  // New modules – added per implementation plan (Phase 2 & Phase 4)
  // ---------------------------------------------------------------------
  expenses: {
    /** List expense records with optional filters */
    list: async (filters?: any) => {
      const { data, error } = await supabase.rpc('get_expenses', { p_filters: filters });
      if (error) throw error;
      return data;
    },
    /** Create a new expense */
    create: async (expense: any) => {
      const { data, error } = await supabase.rpc('create_expense', { p_expense: expense });
      if (error) throw error;
      return data;
    },
    /** Fetch expense categories for dropdowns */
    categories: async () => {
      const { data, error } = await supabase.rpc('get_expense_categories');
      if (error) throw error;
      return data;
    },
  },
  pos: {
    /** Get POS categories (pill filters) - FIXED: uses correct RPC */
    getCategories: async (storeId: string): Promise<PosCategory[]> => {
      debugLog('Fetching categories for store', storeId);
      const { data, error } = await supabase.rpc('get_pos_categories', { p_store_id: storeId });
      if (error) throw error;
      debugLog('Raw categories response', data);
      return mapCategories(data);
    },
    /** Get POS products, optionally filtered by category or search - FIXED: uses search_items_pos */
    getProducts: async (
      storeId: string,
      search?: string,
      categoryId?: string
    ): Promise<PosProduct[]> => {
      debugLog('Fetching products', { storeId, search, categoryId });
      const { data, error } = await supabase.rpc('search_items_pos', {
        p_store_id: storeId,
        p_query: search || '',
        p_category_id: categoryId || null,
        p_limit: 50,
        p_offset: 0,
      });
      if (error) throw error;
      debugLog('Raw products response', data);
      return mapSearchItems(data);
    },
    /** Lookup item by scan (SKU, barcode, or short_code) */
    lookupByScan: async (scanValue: string, storeId: string): Promise<PosProduct | null> => {
      debugLog('Looking up item by scan', { scanValue, storeId });
      const { data, error } = await supabase.rpc('lookup_item_by_scan', {
        p_scan_value: scanValue,
        p_store_id: storeId,
      });
      if (error) throw error;
      debugLog('Raw scan lookup response', data);
      if (!data) return null;
      return mapSearchItems(data)[0] || null;
    },
    /** Create a POS sale transaction - FIXED: uses record_sale RPC */
    createSale: async (saleData: {
      idempotencyKey: string;
      tenantId: string;
      storeId: string;
      items: Array<{ item_id: string; quantity: number; unit_price: number }>;
      payments: Array<{ account_id: string; amount: number; party_id?: string | null }>;
      notes?: string | null;
    }): Promise<SaleResult> => {
      debugLog('Creating sale', saleData);
      const { data, error } = await supabase.rpc('record_sale', {
        p_idempotency_key: saleData.idempotencyKey,
        p_tenant_id: saleData.tenantId,
        p_store_id: saleData.storeId,
        p_items: JSON.stringify(saleData.items),
        p_payments: JSON.stringify(saleData.payments),
        p_notes: saleData.notes || null,
      });
      if (error) throw error;
      debugLog('Sale result', data);
      return {
        status: data?.status === 'success' ? 'success' : 'error',
        batchId: data?.batch_id,
        totalAmount: data?.total_revenue,
        error: data?.status !== 'success' ? 'Sale failed' : undefined,
      };
    },
  },
  reminders: {
    /** List upcoming reminders */
    list: async (storeId: string) => {
      const { data, error } = await supabase.rpc('get_upcoming_reminders', { p_store_id: storeId });
      if (error) throw error;
      return data;
    },
    /** Create a new reminder */
    create: async (reminder: any) => {
      const { data, error } = await supabase.rpc('create_reminder', { p_reminder: reminder });
      if (error) throw error;
      return data;
    },
  },
};
