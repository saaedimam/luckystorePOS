import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  max_stock: number;
}

interface CartState {
  items: CartItem[];
  lang: 'bn' | 'en';
  toggleLang: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lang: 'bn',
      toggleLang: () => set((state) => ({ lang: state.lang === 'bn' ? 'en' : 'bn' })),
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.product_id === item.product_id);
        if (existing) {
          return {
            items: state.items.map(i => 
              i.product_id === item.product_id 
                ? { ...i, quantity: Math.min(i.quantity + 1, i.max_stock) }
                : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (product_id) => set((state) => ({
        items: state.items.filter(i => i.product_id !== product_id)
      })),
      updateQuantity: (product_id, quantity) => set((state) => ({
        items: state.items.map(i => i.product_id === product_id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
    }),
    {
      name: 'lucky-store-cart',
    }
  )
);
