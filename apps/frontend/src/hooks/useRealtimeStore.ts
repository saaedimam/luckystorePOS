import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

const REFRESH_DEBOUNCE_MS = 400

export function useRealtimeStore(storeId: string | undefined, onStockUpdate?: () => void) {
  const refreshTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!storeId) {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      return
    }

    console.log(`🔌 Subscribing to realtime events for store: ${storeId}`)

    const scheduleStockRefresh = (reason: string) => {
      if (!onStockUpdate) return

      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null
        console.log(`🔄 Running batched realtime refresh for store ${storeId}: ${reason}`)
        onStockUpdate()
      }, REFRESH_DEBOUNCE_MS)
    }

    const channel: RealtimeChannel = supabase
      .channel(`store-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_levels',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          console.log('📦 New stock row received:', payload)
          scheduleStockRefresh('stock insert')
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stock_levels',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          console.log('📦 Stock update received:', payload)
          scheduleStockRefresh('stock update')
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'stock_levels',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          console.log('🗑️ Stock row deleted:', payload)
          scheduleStockRefresh('stock delete')
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          console.log('💰 New sale received:', payload)
          // We could trigger a toast or notification here
          // For now, we just log it, or maybe refresh if we were showing sales list
        }
      )
      .subscribe((status) => {
        console.log(`📡 Realtime subscription status for store ${storeId}:`, status)
      })

    return () => {
      console.log(`🔌 Unsubscribing from store: ${storeId}`)
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
      supabase.removeChannel(channel)
    }
  }, [storeId, onStockUpdate])
}
