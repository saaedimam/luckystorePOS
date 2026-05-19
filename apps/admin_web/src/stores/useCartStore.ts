import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/offline-storage';
import { PosProduct } from '@/lib/api/types';

export interface CartItem {
  product: PosProduct;
  qty: number;
  discount: number; // Item-level discount
}

interface CartState {
  items: CartItem[];
  customer_id: string | null;
  
  // Actions
  addItem: (product: PosProduct) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setDiscount: (productId: string, amount: number) => void;
  setCustomer: (customerId: string | null) => void;
  clearCart: () => void;
  
  // Selectors/Computed
  getTotal: () => number;
  getItemCount: () => number;
}

/**
 * useCartStore manages the active POS cart.
 * Persists to localStorage (initial phase) to survive accidental refreshes.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer_id: null,

      addItem: (product) => {
        const { items } = get();
        const existing = items.find((i) => i.product.id === product.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
            ),
          });
        } else {
          set({
            items: [...items, { product, qty: 1, discount: 0 }],
          });
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, qty } : i
          ),
        }));
      },

      setDiscount: (productId, amount) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, discount: amount } : i
          ),
        }));
      },

      setCustomer: (customerId) => set({ customer_id: customerId }),

      clearCart: () => set({ items: [], customer_id: null }),

      getTotal: () => {
        return get().items.reduce((sum, item) => {
          const itemTotal = item.product.price * item.qty - item.discount;
          return sum + Math.max(0, itemTotal);
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: 'lucky-pos-cart',
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
