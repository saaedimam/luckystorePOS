'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/store/useCart';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotal = total();

  return (
    <main className="min-h-screen bg-background-subtle flex flex-col md:flex-row pb-32 md:pb-0">
      {/* Left Column: Cart Items */}
      <div className="flex-1 md:overflow-y-auto md:h-screen hide-scrollbar">
        <header className="sticky top-0 z-40 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-4 py-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-full bg-background-subtle flex items-center justify-center text-text-secondary hover:bg-border-default transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
              aria-label="Back to store"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-text-primary">আপনার কার্ট</h1>
          </div>
          {items.length > 0 && (
            <span className="text-sm font-bold bg-[#D4A843]/15 text-[#D4A843] px-3 py-1 rounded-full border border-[#D4A843]/20">
              {items.reduce((acc, item) => acc + item.quantity, 0)} আইটেম
            </span>
          )}
        </header>

        <div className="p-4 md:p-8 max-w-3xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-background-subtle rounded-full flex items-center justify-center mb-6">
                <ShoppingCart size={48} className="text-text-muted opacity-50" />
              </div>
              <p className="text-lg font-bold text-text-primary mb-2">আপনার কার্ট সম্পূর্ণ খালি</p>
              <p className="text-text-secondary mb-8">দোকান থেকে কিছু পণ্য যোগ করুন।</p>
              <button 
                onClick={() => router.push('/')} 
                className="h-[56px] rounded-[12px] font-bold bg-[#D4A843] text-[#0F172A] px-8 transition-transform active:scale-95 shadow-level-1 hover:shadow-level-2 hover:bg-[#C29837]"
              >
                কেনাকাটা শুরু করুন
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-surface-default border border-border-default rounded-[12px] p-4 flex gap-4 shadow-sm items-center">
                  {/* Image */}
                  <div className="w-20 h-20 bg-background-subtle rounded-lg overflow-hidden shrink-0 relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name_en} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="text-text-muted opacity-20" size={24} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="font-bangla font-bold text-text-primary text-sm leading-[1.6] line-clamp-2 mb-1" title={item.name_bn || item.name_en}>
                      {item.name_bn || item.name_en}
                    </h3>
                    <p className="font-sans text-[10px] text-text-muted uppercase tracking-wider truncate mb-2">
                      {item.name_en}
                    </p>
                    <div className="font-sans font-black tabular-nums text-text-primary mt-auto">
                      ৳{item.price.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-end justify-between h-full py-1">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-text-muted hover:text-danger-default transition-colors p-2 -mr-2"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="flex items-center gap-3 bg-background-subtle rounded-full border border-border-default p-1 mt-2">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-surface-default text-text-primary shadow-sm hover:bg-border-default active:scale-95 transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold tabular-nums w-4 text-center text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-surface-default text-text-primary shadow-sm hover:bg-border-default active:scale-95 transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (Desktop) / Bottom Sheet (Mobile) */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:static md:w-[400px] lg:w-[450px] bg-surface-default border-t md:border-t-0 md:border-l border-border-default shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none z-50 flex flex-col md:h-screen">
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8 hidden md:block">
            <h2 className="text-lg font-bold text-text-primary mb-6">কার্ট সারসংক্ষেপ</h2>
            <div className="border-t border-border-default pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">সাবটোটাল</span>
                <span className="font-semibold tabular-nums">৳{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-text-muted">ডেলিভারি ফি চেকআউট পেজে হিসাব করা হবে।</p>
            </div>
          </div>

          <div className="p-4 md:p-8 bg-surface-default md:bg-transparent">
            <div className="flex justify-between items-end mb-4 md:hidden">
               <div className="flex flex-col">
                 <span className="text-xs font-semibold text-text-secondary">মোট সাবটোটাল</span>
                 <span className="text-xl font-black text-text-primary">৳{subtotal.toLocaleString('en-IN')}</span>
               </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full h-[56px] rounded-[12px] font-bold text-lg flex items-center justify-center gap-2 bg-[#D4A843] text-[#0F172A] hover:bg-[#C29837] active:scale-[0.98] shadow-level-2 transition-all"
            >
              চেকআউটে যান <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
