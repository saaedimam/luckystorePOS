'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = total;
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="min-h-screen bg-bg-canvas flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-canvas/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-border-default">
        <button
          onClick={() => router.push('/')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle transition-colors"
          aria-label="Back to store"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-text-primary font-bangla">আপনার কার্ট</h1>
          <p className="text-xs text-text-muted">{itemCount} আইটেম</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-bg-subtle rounded-2xl flex items-center justify-center mb-4">
              <ShoppingCart size={32} className="text-text-muted" />
            </div>
            <p className="text-base font-bold text-text-primary font-bangla mb-1">আপনার কার্ট খালি</p>
            <p className="text-sm text-text-muted mb-6">পণ্য যোগ করে কেনাকাটা শুরু করুন</p>
            <button
              onClick={() => router.push('/')}
              className="h-12 px-6 rounded-xl font-bold bg-primary text-text-primary hover:bg-primary-hover active:scale-95 transition-all"
            >
              কেনাকাটা শুরু করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-bg-surface border border-border-default rounded-xl p-3 flex gap-3"
              >
                {/* Image */}
                <div className="w-20 h-20 bg-bg-canvas rounded-lg overflow-hidden shrink-0 relative">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name_en}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="text-text-muted" size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3
                    className="font-bangla font-semibold text-sm text-text-primary leading-snug line-clamp-2"
                    title={item.name_bn || item.name_en}
                  >
                    {item.name_bn || item.name_en}
                  </h3>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">{item.name_en}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="font-bold text-text-primary tabular-nums">
                      ৳{item.price.toLocaleString('en-IN')}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-bg-subtle rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-bg-surface text-text-primary shadow-sm hover:bg-bg-canvas active:scale-95 transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold tabular-nums w-5 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-bg-surface text-text-primary shadow-sm hover:bg-bg-canvas active:scale-95 transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-text-muted hover:text-rose-500 transition-colors p-1 self-start"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-bg-surface border-t border-border-default p-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">মোট ({itemCount} আইটেম)</span>
              <span className="text-xl font-bold text-text-primary tabular-nums">
                ৳{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full h-12 rounded-xl font-bold bg-primary text-text-primary hover:bg-primary-hover active:scale-[0.98] shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
            >
              চেকআউট করুন
              <ArrowRight size={18} />
            </button>
            <p className="text-[10px] text-center text-text-muted">
              ডেলিভারি ফি পরবর্তী ধাপে যোগ করা হবে
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
