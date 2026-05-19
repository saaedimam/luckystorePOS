import React from 'react';
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/useCartStore';

/**
 * TouchCart: A premium, touch-optimized cart component for the POS.
 */
export function TouchCart({ onCheckout }: { onCheckout?: () => void }) {
  const { items, removeItem, updateQty, getTotal, getItemCount, clearCart } = useCartStore();
  const total = getTotal();
  const count = getItemCount();

  return (
    <div className="flex flex-col h-full glass-card rounded-[2rem] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Current Order</h2>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{count} items</p>
        </div>
        <button 
          onClick={clearCart}
          className="w-10 h-10 flex items-center justify-center hover:bg-red-500/20 text-red-400 rounded-full transition-all active:scale-90"
          title="Clear Cart"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.product.id}
              layout
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                <p className="text-xs text-slate-400">৳{item.product.price.toLocaleString()}</p>
              </div>

              {/* Touch Controls */}
              <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                <button 
                  onClick={() => updateQty(item.product.id, item.qty - 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-bold tabular-nums">{item.qty}</span>
                <button 
                  onClick={() => updateQty(item.product.id, item.qty + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-right min-w-[80px]">
                <p className="font-bold text-sm tracking-tight">
                  ৳{(item.product.price * item.qty).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={40} strokeWidth={1.5} className="opacity-20" />
            </div>
            <p className="font-medium">Cart is empty</p>
            <p className="text-xs opacity-60">Scan items to start billing</p>
          </div>
        )}
      </div>

      {/* Footer / Summary */}
      <div className="p-8 bg-black/60 border-t border-white/10">
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium">৳{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold">Total Amount</span>
            <span className="text-2xl font-black text-sky-400 tabular-nums">
              ৳{total.toLocaleString()}
            </span>
          </div>
        </div>

        <button 
          disabled={items.length === 0}
          onClick={onCheckout}
          className="pos-button w-full h-16 bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-[0_0_20px_rgba(14,165,233,0.3)]"
        >
          <CreditCard size={22} className="mr-2" />
          <span className="text-lg uppercase tracking-wider">Pay & Complete</span>
          <ChevronRight size={22} className="ml-auto opacity-50" />
        </button>
      </div>
    </div>
  );
}
