import { supabase } from '../../supabase';

type InventoryValueRow = {
  id: string;
  name: string;
  sku: string | null;
  qty_on_hand: number;
  cost: number;
  totalValue: number;
};

export const reports = {
  // Sales Report - get sales data with date range
  getSalesReport: async (storeId: string, startDate: string, endDate: string) => {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount, created_at')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    if (salesError) throw salesError;

    // Get top selling products
    const { data: saleItems, error: itemsError } = await supabase
      .from('sale_items')
      .select('qty, price, item_id')
      .in('sale_id', sales?.map((s: Record<string, unknown>) => s.id) || []);

    if (itemsError) throw itemsError;

    // Resolve item names
    const itemIds = [...new Set(saleItems?.map((i: Record<string, unknown>) => i.item_id) || [])];
    const { data: itemNames } = await supabase
      .from('items')
      .select('id, name')
      .in('id', itemIds);

    const nameMap = new Map<unknown, unknown>(itemNames?.map((i: Record<string, unknown>) => [i.id, i.name]) || []);

    // Aggregate top products by quantity
    const productMap = new Map<unknown, unknown>();
    saleItems?.forEach((item: Record<string, unknown>) => {
      const name = nameMap.get(item.item_id) || 'Unknown';
      const existing = productMap.get(name) || { name, quantity: 0, revenue: 0 };
      existing.quantity += item.qty || 0;
      existing.revenue += (item.qty || 0) * (item.price || 0);
      productMap.set(name, existing);
    });

    const topProducts = Array.from(productMap.values())
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => b.quantity - a.quantity)
      .slice(0, 10);

    // Group sales by day
    const dailyMap = new Map();
    sales?.forEach((sale: Record<string, unknown>) => {
      const day = sale.created_at.split('T')[0];
      const existing = dailyMap.get(day) || { date: day, revenue: 0, count: 0 };
      existing.revenue += sale.total_amount || 0;
      existing.count += 1;
      dailyMap.set(day, existing);
    });

    const dailySales = Array.from(dailyMap.values()).sort((a: Record<string, unknown>, b: Record<string, unknown>) => a.date.localeCompare(b.date));

    const totalRevenue = sales?.reduce((sum: number, s: Record<string, unknown>) => sum + (s.total_amount || 0), 0) || 0;
    const transactionCount = sales?.length || 0;
    const avgTicket = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return { totalRevenue, transactionCount, avgTicket, topProducts, dailySales };
  },

  // Inventory Value Report
  getInventoryValue: async (storeId: string) => {
    const { data: stockValuation, error } = await supabase
      .rpc('get_stock_valuation', {
        p_store_id: storeId,
      });

    if (error) throw error;

    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventory: InventoryValueRow[] = stockValuation?.map((item: Record<string, unknown>) => {
      const qtyOnHand = item.qty_on_hand || 0;
      totalValue += item.total_value || 0;
      if (qtyOnHand === 0) outOfStockCount++;
      else if (qtyOnHand <= 5) lowStockCount++;
      return {
        id: item.item_id,
        name: item.item_name,
        sku: item.sku,
        qty_on_hand: qtyOnHand,
        cost: item.unit_cost || 0,
        totalValue: item.total_value || 0,
      };
    }) || [];

    inventory.sort((a, b) => b.totalValue - a.totalValue);

    return { totalValue, totalItems: inventory.length, lowStockCount, outOfStockCount, inventory };
  },

  // Profit & Loss Report
  getProfitLoss: async (storeId: string, startDate: string, endDate: string) => {
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount')
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    if (salesError) throw salesError;

    const grossRevenue = sales?.reduce((sum: number, s: Record<string, unknown>) => sum + (s.total_amount || 0), 0) || 0;

    // Get COGS from sale_items
    const { data: saleItems, error: itemsError } = await supabase
      .from('sale_items')
      .select('qty, cost')
      .in('sale_id', sales?.map((s: Record<string, unknown>) => s.id) || []);

    if (itemsError) throw itemsError;

    const cogs = saleItems?.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.qty || 0) * (item.cost || 0)), 0) || 0;

    // Get expenses
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('store_id', storeId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (expError) throw expError;

    const totalExpenses = expenses?.reduce((sum: number, e: Record<string, unknown>) => sum + (e.amount || 0), 0) || 0;
    const grossProfit = grossRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    return { grossRevenue, cogs, grossProfit, totalExpenses, netProfit };
  },

  // Customer Analytics
  getCustomerAnalytics: async (storeId: string, limit = 50) => {
    const { data, error } = await supabase.rpc('get_customer_analytics', {
      p_store_id: storeId,
      p_limit: limit,
    });
    if (error) throw error;
    return data;
  },

  // Staff Performance
  getStaffPerformance: async (storeId: string, days = 30) => {
    const { data, error } = await supabase.rpc('get_staff_performance', {
      p_store_id: storeId,
      p_days: days,
    });
    if (error) throw error;
    return data;
  },
};
