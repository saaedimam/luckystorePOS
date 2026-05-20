import React from 'react';
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/useCartStore';
import { Button } from '../../ui/Button';

/**
 * TouchCart: A premium, touch-optimized cart component for the POS.
 */
export function TouchCart({ onCheckout }: { onCheckout?: () => void }) {
  const { items, updateQty, getTotal, getItemCount, clearCart } = useCartStore();
  const total = getTotal();
  const count = getItemCount();

  return (
    <div className="flex flex-col h-full bg-surface-raised rounded-3xl overflow-hidden border border-border-default shadow-level-2">
      {/* Header */}
      <div className="p-6 border-b border-border-default flex justify-between items-center bg-background-subtle">
        <div>
          <h2 className="text-heading font-black tracking-tight text-text-primary">Current Order</h2>
          <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest">{count} items</p>
        </div>
        <button 
          onClick={clearCart}
          className="w-10 h-10 flex items-center justify-center hover:bg-danger/10 text-danger rounded-xl transition-all active:scale-90"
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
              className="p-4 bg-surface rounded-2xl border border-border-default flex items-center gap-4 group hover:border-primary/50 transition-colors shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate text-text-primary">{item.product.name}</h4>
                <p className="text-xs text-text-secondary font-medium">৳{item.product.price.toLocaleString()}</p>
              </div>

              {/* Touch Controls */}
              <div className="flex items-center gap-1 bg-background-default rounded-xl p-1 border border-border-default">
                <button 
                  onClick={() => updateQty(item.product.id, Math.max(0, item.qty - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface rounded-lg transition-colors text-text-primary"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-black tabular-nums text-text-primary">{item.qty}</span>
                <button 
                  onClick={() => updateQty(item.product.id, item.qty + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-surface rounded-lg transition-colors text-text-primary"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-right min-w-[80px]">
                <p className="font-black text-sm tracking-tight text-text-primary">
                  ৳{(item.product.price * item.qty).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-text-muted py-20">
            <div className="w-20 h-20 bg-background-default rounded-full flex items-center justify-center mb-4 border border-dashed border-border-strong/50">
              <ShoppingCart size={40} strokeWidth={1.5} className="opacity-20" />
            </div>
            <p className="font-bold">Cart is empty</p>
            <p className="text-[11px] uppercase tracking-widest opacity-60">Scan items to start billing</p>
          </div>
        )}
      </div>

      {/* Footer / Summary */}
      <div className="p-8 bg-background-subtle border-t border-border-default">
        <div className="space-y-3 mb-8">
          <div className="flex justify-between text-sm text-text-secondary font-medium">
            <span>Subtotal</span>
            <span className="tabular-nums">৳{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border-default border-dashed">
            <span className="text-lg font-black text-text-primary">Total Amount</span>
            <span className="text-3xl font-black text-primary tabular-nums">
              ৳{total.toLocaleString()}
            </span>
          </div>
        </div>

        <Button 
          disabled={items.length === 0}
          onClick={onCheckout}
          size="lg"
          className="w-full h-16 shadow-lg shadow-primary/20"
        >
          <CreditCard size={22} className="mr-3" />
          <span className="text-lg uppercase tracking-wider font-black">Pay & Complete</span>
          <ChevronRight size={22} className="ml-auto opacity-50" />
        </Button>
      </div>
    </div>
  );
}
