import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useCartStore } from './useCartStore';

export interface OnlineOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_method: string;
  cancellation_reason?: string;
  created_at: string;
  isNew?: boolean; // Ephemeral flag for UI pulse
}

interface OrderQueueState {
  orders: OnlineOrder[];
  selectedOrderId: string | null;
  isSubscribed: boolean;
  audioCtx: AudioContext | null;

  // Actions
  initializeAudioContext: () => void;
  initializeSubscription: (tenantId: string | null) => void;
  setOrders: (orders: OnlineOrder[]) => void;
  setSelectedOrderId: (id: string | null) => void;
  pushToPosCart: (orderId: string) => Promise<void>;
  clearNewFlag: (orderId: string) => void;
}

export const useOrderQueue = create<OrderQueueState>((set, get) => ({
  orders: [],
  selectedOrderId: null,
  isSubscribed: false,
  audioCtx: null,

  initializeAudioContext: () => {
    let ctx = get().audioCtx;
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      set({ audioCtx: ctx });
    }
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => console.log('AudioContext resumed'));
    }
  },

  initializeSubscription: (tenantId: string | null) => {
    if (!tenantId) return;
    if (get().isSubscribed) return;

    set({ isSubscribed: true });

    // Initial fetch
    (supabase as any)
      .from('online_orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: any, error: any }) => {
        if (!error && data) {
          set({ orders: data as OnlineOrder[] });
        }
      });

    // Realtime subscription
    (supabase as any)
      .channel('online-orders-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          const { orders, audioCtx } = get();

          if (eventType === 'INSERT') {
            const newOrder = { ...newRecord, isNew: true } as OnlineOrder;
            set({ orders: [newOrder, ...orders] });

            // Play audio ping if context is ready and order is pending
            if ((newOrder.status === 'PENDING' || newOrder.status === 'pending') && audioCtx && audioCtx.state === 'running') {
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
              osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
              gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            }
          } else if (eventType === 'UPDATE') {
            set({
              orders: orders.map((o) =>
                o.id === newRecord.id ? { ...o, ...newRecord, isNew: o.isNew } : o
              ),
            });
          } else if (eventType === 'DELETE') {
            set({ orders: orders.filter((o) => o.id !== oldRecord.id) });
            if (get().selectedOrderId === oldRecord.id) {
              set({ selectedOrderId: null });
            }
          }
        }
      )
      .subscribe();
  },

  setOrders: (orders) => set({ orders }),
  
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),

  clearNewFlag: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, isNew: false } : o)),
    }));
  },

  pushToPosCart: async (orderId) => {
    const { orders } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Fetch order items
    const { data: items, error } = await (supabase as any)
      .from('online_order_items')
      .select('*, product:products(*)')
      .eq('order_id', orderId);

    if (error) {
      console.error('Failed to fetch order items', error);
      return;
    }

    const cartStore = useCartStore.getState();
    cartStore.clearCart();

    items.forEach((item: any) => {
      // Map to POS Product structure as expected by addItem.
      // Note: We might need to ensure the product object maps correctly.
      if (item.product) {
        cartStore.addItem({
          id: item.product.id,
          name: item.product.name,
          price: item.unit_price,
          barcode: item.product.barcode,
          stock: item.product.qty,
          category: item.product.category,
          imageUrl: item.product.image_url,
        });
        
        // Update to correct quantity
        cartStore.updateQty(item.product.id, item.quantity);
      }
    });
  },
}));
