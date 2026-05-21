import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Json } from '@/lib/database.types';
import { useOfflineStore, OfflineSale } from '@/stores/useOfflineStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * useSyncSales hook orchestrates the background synchronization of offline sales.
 * Implements a FIFO queue drain with basic retry logic and error reporting.
 */
export function useSyncSales() {
  const isOnline = useOnlineStatus();
  const { queue, removeFromQueue, markAsSyncing, markAsFailed } = useOfflineStore();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async (sale: OfflineSale) => {
      const payload = sale.payload as {
        storeId: string;
        cashierId: string;
        customerId?: string | null;
        items: unknown[];
        payments: unknown[];
        total: number;
        discount: number;
      };
      const { error } = await supabase.rpc('complete_sale_v2', {
        p_store_id: payload.storeId,
        p_cashier_id: payload.cashierId,
        p_customer_id: payload.customerId ?? null,
        p_items: payload.items as unknown as Json,
        p_payments: payload.payments as unknown as Json,
        p_total: payload.total,
        p_discount: payload.discount,
        p_offline_created_at: sale.createdAt,
        p_operation_id: sale.id,
      });

      if (error) throw error;
    },
    onSuccess: (_, sale) => {
      removeFromQueue(sale.id);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      
      // Notify only if it was a queued item (not a direct hit)
      if (queue.length > 0) {
        toast.success(`Sale synced successfully`, {
          description: `Transaction ${sale.id.slice(0, 8)} uploaded.`,
        });
      }
    },
    onError: (error, sale) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      markAsFailed(sale.id, errorMessage);
      
      console.error(`[Sync Failure] Sale ${sale.id}:`, error);
    }
  });

  /**
   * Effect to trigger the sync loop whenever online status or queue changes.
   */
  useEffect(() => {
    // Only attempt sync if online and not already processing
    if (!isOnline || queue.length === 0 || syncMutation.isPending) return;

    // Find the next eligible sale (pending or failed but retryable)
    const nextSale = queue.find(s => 
      s.status === 'pending' || 
      (s.status === 'failed' && s.retryCount < 5)
    );

    if (nextSale) {
      markAsSyncing(nextSale.id);
      syncMutation.mutate(nextSale);
    }
  }, [isOnline, queue, syncMutation, markAsSyncing]);

  return {
    isSyncing: syncMutation.isPending,
    pendingCount: queue.filter(s => s.status !== 'syncing').length,
    failedCount: queue.filter(s => s.status === 'failed').length,
  };
}
