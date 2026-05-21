import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WhatsAppLog {
  id: string;
  status: 'sent' | 'failed' | 'pending';
  template: string;
  created_at: string;
  error_code?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useWhatsAppNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotificationLogs = useCallback(async (orderId: string): Promise<WhatsAppLog[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: queryError } = await (supabase as any)
      .from('whatsapp_logs')
      .select('id, status, template, created_at, error_code')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Error fetching WhatsApp logs:', queryError);
      return [];
    }

    return (data || []) as WhatsAppLog[];
  }, []);

  const sendManualNotification = useCallback(async (orderId: string, status: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase as any).rpc('send_whatsapp_notification_manually', {
        p_order_id: orderId,
        p_status: status
      });

      if (rpcError) throw rpcError;

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send notification';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLastNotificationStatus = useCallback(async (orderId: string): Promise<WhatsAppLog | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: queryError } = await (supabase as any)
      .from('whatsapp_logs')
      .select('id, status, template, created_at, error_code')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (queryError || !data) return null;
    return data as WhatsAppLog;
  }, []);

  return {
    isLoading,
    error,
    getNotificationLogs,
    sendManualNotification,
    getLastNotificationStatus
  };
}
