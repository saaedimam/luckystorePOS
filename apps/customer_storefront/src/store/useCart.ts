"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types/product";

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const { items } = get();
        const existing = items.find((item) => item.id === product.id);
        if (existing) {
          set({ items: items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      removeItem: (productId) => set({ items: get().items.filter((item) => item.id !== productId) }),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return; }
        set({ items: get().items.map((item) => item.id === productId ? { ...item, quantity } : item) });
      },
      clearCart: () => set({ items: [] }),
      get total() { return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0); },
      get count() { return get().items.reduce((sum, item) => sum + item.quantity, 0); },
    }),
    { name: "lucky-store-cart", partialize: (state) => ({ items: state.items }) }
  )
);
