// =============================================================================
// RPC-to-Domain Mappers for POS and Admin
// Fail-fast on critical field corruption to prevent silent bugs
// =============================================================================

import type { 
  PosProduct, 
  PosCategory, 
  Reminder, 
  ReminderType,
  DailySale,
  Expense,
  InventoryTransaction,
  CompetitorPrice,
  ExpenseCategory,
  ExpensePaymentType
} from './types';
import type { Database } from '../database.types';

export type SearchItemRow = Database['public']['Tables']['items']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
type ReminderRow = Database['public']['Tables']['reminders']['Row'];
type DailySaleRow = Database['public']['Tables']['daily_sales']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type StockLedgerRow = Database['public']['Tables']['stock_ledger']['Row'];
type CompetitorPriceRow = Database['public']['Tables']['competitor_prices']['Row'];

/**
 * Maps a row from search_items_pos or lookup_item_by_scan to PosProduct
 */
export function mapSearchItem(row: SearchItemRow & { qty_on_hand?: number, stock?: number, unit_price?: number, category?: string, item_id?: string }): PosProduct {
  const id = row.id ?? row.item_id;
  if (!id) {
    throw new Error(`Invalid item: missing id. Raw: ${JSON.stringify(row)}`);
  }

  const price = Number(row.price ?? row.unit_price ?? NaN);
  if (Number.isNaN(price) || price <= 0) {
    throw new Error(`Item ${row.name ?? id ?? 'unknown'} has invalid price: ${price}`);
  }

  return {
    id: String(id),
    name: row.name ?? 'Unknown',
    sku: row.sku ?? undefined,
    barcode: row.barcode ?? undefined,
    shortCode: row.short_code ?? undefined,
    brand: row.brand ?? undefined,
    price,
    cost: row.cost ? Number(row.cost) : undefined,
    stock: Number(row.qty_on_hand ?? row.stock ?? 0),
    category: row.category ?? undefined,
    categoryId: row.category_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    groupTag: row.group_tag ?? undefined,
  };
}

/**
 * Maps a row from get_pos_categories to PosCategory
 */
export function mapCategory(row: CategoryRow & { item_count?: number }): PosCategory {
  if (!row.id) {
    throw new Error(`Invalid category: missing id. Raw: ${JSON.stringify(row)}`);
  }

  return {
    id: row.id,
    name: row.name ?? 'Uncategorized',
    itemCount: Number(row.item_count ?? 0),
  };
}

/**
 * Maps an array of rows to PosProduct[]
 */
export function mapSearchItems(rows: Array<SearchItemRow & { qty_on_hand?: number, stock?: number, unit_price?: number, category?: string }> | (SearchItemRow & { qty_on_hand?: number, stock?: number, unit_price?: number, category?: string })): PosProduct[] {
  if (!rows) return [];
  if (Array.isArray(rows)) return rows.map(mapSearchItem);
  if (typeof rows === 'object') return [mapSearchItem(rows)];
  return [];
}

/**
 * Maps an array of rows to PosCategory[]
 */
export function mapCategories(rows: Array<CategoryRow & { item_count?: number }> | (CategoryRow & { item_count?: number })): PosCategory[] {
  if (!rows) return [];
  if (Array.isArray(rows)) return rows.map(mapCategory);
  if (typeof rows === 'object') return [mapCategory(rows)];
  return [];
}

/**
 * Maps a row from daily_sales table / RPC to DailySale domain type
 */
export function mapDailySale(row: DailySaleRow): DailySale {
  return {
    id: row.id || '',
    storeId: row.store_id || '',
    saleDate: row.sale_date || '',
    cashAmount: Number(row.cash_amount ?? 0),
    bkashAmount: Number(row.bkash_amount ?? 0),
    creditAmount: Number(row.credit_amount ?? 0),
    totalSales: Number(row.total_sales ?? 0),
    stockPurchase: Number(row.stock_purchase ?? 0),
    dailyExpense: Number(row.daily_expense ?? 0),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

/**
 * Maps a row from expenses table / RPC to Expense domain type
 */
export function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id || '',
    storeId: row.store_id || '',
    expenseDate: row.expense_date || '',
    vendorName: row.vendor_name || '',
    description: row.description || '',
    amount: Number(row.amount ?? 0),
    paymentType: (row.payment_type as ExpensePaymentType) || 'Cash',
    category: (row.category as ExpenseCategory) || 'All Other Expenses',
    ledgerBatchId: row.ledger_batch_id || null,
    createdBy: row.created_by || null,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

/**
 * Maps a row from stock_ledger to InventoryTransaction domain type
 */
export function mapInventoryTransaction(row: StockLedgerRow): InventoryTransaction {
  return {
    id: row.id || '',
    storeId: row.store_id || '',
    productId: row.product_id || '',
    transactionType: (row.transaction_type as "IN" | "OUT" | "ADJUST" | "TRANSFER") || 'ADJUST',
    quantity: Number(row.quantity_change ?? 0),
    referenceId: row.reference_id || undefined,
    notes: row.reason || undefined,
    performedBy: row.performed_by || undefined,
    createdAt: row.created_at || '',
  };
}

/**
 * Maps a row from competitor_prices to CompetitorPrice domain type
 */
export function mapCompetitorPrice(row: CompetitorPriceRow): CompetitorPrice {
  return {
    id: row.id || '',
    product_id: row.product_id || '',
    competitor_name: row.competitor_name || '',
    competitor_price: Number(row.competitor_price ?? 0),
    competitor_url: row.competitor_product_url || null,
    scraped_at: row.scraped_at || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
  };
}

/**
 * Maps a row from reminders table / RPC to Reminder domain type
 */
export function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id || '',
    tenantId: row.tenant_id || '',
    storeId: row.store_id || '',
    title: row.title || '',
    description: row.description || null,
    reminderDate: row.reminder_date || '',
    reminderType: (row.reminder_type as ReminderType) || 'other',
    isCompleted: !!row.is_completed,
    createdBy: row.created_by || null,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

/**
 * Maps an array of reminder rows to Reminder[]
 */
export function mapReminders(rows: ReminderRow[] | ReminderRow): Reminder[] {
  if (!rows) return [];
  if (Array.isArray(rows)) return rows.map(mapReminder);
  if (typeof rows === 'object') return [mapReminder(rows)];
  return [];
}
