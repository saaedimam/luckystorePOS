import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

export function useDashboardData(storeId: string | null) {
  const commonOptions = {
    enabled: !!storeId,
    staleTime: 15000,
    refetchInterval: 30000, // 30 seconds polling for real-time physics sync
    placeholderData: keepPreviousData,
  };

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => api.dashboard.getStats(storeId!),
    ...commonOptions,
  });

  const lowStockQuery = useQuery({
    queryKey: ['low-stock', storeId],
    queryFn: () => api.dashboard.getLowStock(storeId!),
    ...commonOptions,
  });

  const remindersQuery = useQuery({
    queryKey: ['dashboard-reminders', storeId],
    queryFn: () => api.reminders.list(storeId!),
    ...commonOptions,
  });

  const dailySalesQuery = useQuery({
    queryKey: ['daily-sales-comparison', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('store_id', storeId!)
        .order('sale_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    ...commonOptions,
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses-dashboard', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('store_id', storeId!)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    ...commonOptions,
  });

  const recentSalesQuery = useQuery({
    queryKey: ['recent-sales-dashboard', storeId],
    queryFn: () => api.sales.history(storeId!),
    ...commonOptions,
  });

  return {
    statsQuery,
    lowStockQuery,
    remindersQuery,
    dailySalesQuery,
    expensesQuery,
    recentSalesQuery,
    isLoading:
      statsQuery.isLoading ||
      lowStockQuery.isLoading ||
      remindersQuery.isLoading ||
      dailySalesQuery.isLoading ||
      expensesQuery.isLoading ||
      recentSalesQuery.isLoading,
    isError:
      statsQuery.isError ||
      lowStockQuery.isError ||
      remindersQuery.isError ||
      dailySalesQuery.isError ||
      expensesQuery.isError ||
      recentSalesQuery.isError,
    refetchAll: () => {
      statsQuery.refetch();
      lowStockQuery.refetch();
      remindersQuery.refetch();
      dailySalesQuery.refetch();
      expensesQuery.refetch();
      recentSalesQuery.refetch();
    },
  };
}
export type UseDashboardDataReturn = ReturnType<typeof useDashboardData>;
export default useDashboardData;
