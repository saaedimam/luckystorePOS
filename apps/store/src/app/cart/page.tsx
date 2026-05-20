"use client";

import { useCartStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function CartPage() {
  const { items, lang, updateQuantity, removeItem, getSubtotal } = useCartStore();


  const subtotal = getSubtotal();
  const deliveryFee = 40; // Fixed delivery fee
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-bg-card rounded-full flex items-center justify-center mb-6 text-text-muted">
          <Trash2 size={40} />
        </div>
        <h2 className="text-xl font-black text-text-main mb-2">
          {lang === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
        </h2>
        <p className="text-text-muted mb-8">
          {lang === 'bn' ? 'অর্ডার করতে কিছু পণ্য যোগ করুন' : 'Add some products to order'}
        </p>
        <Link href="/" className="px-6 py-3 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-colors">
          {lang === 'bn' ? 'শপিং করুন' : 'Go Shopping'}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col min-h-full">
      <h2 className="text-xl font-black uppercase tracking-widest mb-6 px-2">
        {lang === 'bn' ? 'কার্ট' : 'Cart'}
      </h2>
      
      <div className="flex-1 space-y-4">
        {items.map(item => (
          <div key={item.product_id} className="bg-bg-card border border-white/5 p-4 rounded-2xl shadow-lg flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-text-main leading-tight flex-1 pr-4">{item.name}</h3>
              <button 
                onClick={() => removeItem(item.product_id)}
                className="text-danger hover:text-danger-dark p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-black text-primary tabular-nums">
                {formatPrice(item.price, lang)}
              </span>
              
              <div className="flex items-center gap-3 bg-bg-main px-3 py-1.5 rounded-full border border-white/10">
                <button 
                  onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                  className="text-text-muted hover:text-text-main disabled:opacity-50"
                  disabled={item.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="font-bold w-6 text-center tabular-nums">
                  {lang === 'bn' ? formatPrice(item.quantity, 'bn').replace('৳', '') : item.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(item.product_id, Math.min(item.max_stock, item.quantity + 1))}
                  className="text-text-muted hover:text-text-main disabled:opacity-50"
                  disabled={item.quantity >= item.max_stock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-bg-card border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between text-text-muted font-medium">
          <span>{lang === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
          <span className="tabular-nums">{formatPrice(subtotal, lang)}</span>
        </div>
        <div className="flex justify-between text-text-muted font-medium">
          <span>{lang === 'bn' ? 'ডেলিভারি ফি' : 'Delivery Fee'}</span>
          <span className="tabular-nums">{formatPrice(deliveryFee, lang)}</span>
        </div>
        <div className="pt-4 border-t border-white/10 flex justify-between text-lg font-black text-text-main">
          <span>{lang === 'bn' ? 'মোট' : 'Total'}</span>
          <span className="text-primary tabular-nums">{formatPrice(total, lang)}</span>
        </div>
        
        <Link 
          href="/checkout" 
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-colors"
        >
          {lang === 'bn' ? 'এগিয়ে যান' : 'Proceed'}
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
