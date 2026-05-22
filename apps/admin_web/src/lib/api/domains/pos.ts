import { supabase } from '../../supabase';
import { mapSearchItems, mapCategories, SearchItemRow, CategoryRow } from '../mappers';
import type { PosProduct, PosCategory, SaleResult } from '../types';
import { createDebugLogger } from '../../debug';

const debugLog = createDebugLogger('POS API');

export const pos = {
  getCategories: async (storeId: string): Promise<PosCategory[]> => {
    debugLog('Fetching categories for store', storeId);
    const { data, error } = await supabase.rpc('get_pos_categories', { p_store_id: storeId });
    if (error) throw error;
    debugLog('Raw categories response', data);
    return mapCategories(data as (CategoryRow & { item_count?: number })[]);
  },
  getProducts: async (storeId: string, search?: string, categoryId?: string): Promise<PosProduct[]> => {
    debugLog('Fetching products', { storeId, search, categoryId });
    const { data, error } = await supabase.rpc('search_items_pos', {
      p_store_id: storeId,
      p_query: search || '',
      p_category_id: categoryId || undefined,
      p_limit: 50,
      p_offset: 0,
    });
    if (error) throw error;
    debugLog('Raw products response', data);
    return mapSearchItems(data as (SearchItemRow & { qty_on_hand?: number, stock?: number, unit_price?: number, category?: string })[]);
  },
  lookupByScan: async (scanValue: string, storeId: string): Promise<PosProduct | null> => {
    debugLog('Looking up item by scan', { scanValue, storeId });
    const { data, error } = await supabase.rpc('lookup_item_by_scan', {
      p_scan_value: scanValue,
      p_store_id: storeId,
    });
    if (error) throw error;
    debugLog('Raw scan lookup response', data);
    if (!data) return null;
    return mapSearchItems(data as (SearchItemRow & { qty_on_hand?: number, stock?: number, unit_price?: number, category?: string })[])[0] || null;
  },
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
      p_notes: saleData.notes || undefined,
    });
    if (error) throw error;
    debugLog('Sale result', data);
    
    const result = data as Record<string, unknown>;
    return {
      status: result?.status === 'success' ? 'success' : 'error',
      batchId: result?.batch_id as string | undefined,
      totalAmount: result?.total_revenue as number | undefined,
      error: result?.status !== 'success' ? 'Sale failed' : undefined,
    };
  },

  completeSaleV2: async (payload: {
    storeId: string;
    cashierId: string;
    customerId?: string;
    items: Array<{ product_id: string; qty: number; unit_price: number; discount?: number }>;
    payments: Array<{ method: string; amount: number; reference?: string }>;
    total: number;
    discount: number;
    operationId: string;
    offlineCreatedAt?: string;
  }): Promise<{ status: string; sale_id?: string; batch_id?: string }> => {
    debugLog('Completing sale V2', payload);
    const { data, error } = await supabase.rpc('complete_sale_v2', {
      p_store_id: payload.storeId,
      p_cashier_id: payload.cashierId,
      p_customer_id: payload.customerId || undefined,
      p_items: payload.items,
      p_payments: payload.payments,
      p_total: payload.total,
      p_discount: payload.discount,
      p_operation_id: payload.operationId,
      p_offline_created_at: payload.offlineCreatedAt || new Date().toISOString(),
    });
    if (error) throw error;
    return data as { status: string; sale_id?: string; batch_id?: string };
  },
};