import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WhatsAppLog {
  id: string;
  status: 'sent' | 'failed' | 'pending';
  template: string;
  created_at: string;
  error_code?: string;
}

export function useWhatsAppNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNotificationLogs = useCallback(async (orderId: string): Promise<WhatsAppLog[]> => {
    const { data, error: queryError } = await supabase
      .from('whatsapp_logs')
      .select('id, status, template, created_at, error_code')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

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
      const { data, error: rpcError } = await (supabase.rpc as unknown as (...args: unknown[]) => Promise<{ data: unknown; error: Error | null }>)('send_whatsapp_notification_manually', {
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
    const { data, error: queryError } = await supabase
      .from('whatsapp_logs')
      .select('id, status, template, created_at, error_code')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

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
