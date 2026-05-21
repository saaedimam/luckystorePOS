'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MessageCircle, ShoppingCart, ChevronRight } from 'lucide-react';
import { ProductCatalog } from '@/components/ProductCatalog';
import { useCart } from '@/store/useCart';
import { motion, AnimatePresence } from 'framer-motion';

export default function StorefrontPage() {
  const router = useRouter();
  const { items, total } = useCart();
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <main className="flex-1 flex flex-col relative bg-background-default min-h-screen">
        {/* Premium Header */}
        <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-6 py-4 flex items-center justify-between shadow-level-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-default rounded-[12px] flex items-center justify-center shadow-level-2">
              <ShoppingBag size={20} className="text-primary-on" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-text-primary leading-none">লাকি স্টোর</h1>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Dhaka Branch</p>
            </div>
          </div>
          
          <a 
            href="https://wa.me/8801XXXXXXXXX" 
            className="p-2.5 bg-success-subtle text-success-default rounded-full border border-success/10 hover:bg-success-subtle/80 transition-all"
          >
            <MessageCircle size={20} />
          </a>
        </header>

        {/* Content */}
        <div className="store-container !pt-8">
          <section className="mb-12">
            <div className="bg-primary-default/10 border border-primary-default/20 rounded-[16px] p-6 mb-10 flex items-center gap-6 relative overflow-hidden group">
               <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary-default/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
               <div className="relative z-10">
                 <h2 className="text-2xl font-black text-text-primary tracking-tight mb-1">প্রয়োজনীয় সবকিছু এক জায়গায়</h2>
                 <p className="text-sm text-text-secondary font-sans">Fresh groceries & essentials delivered to your door.</p>
               </div>
            </div>

            <ProductCatalog />
          </section>
        </div>

        {/* Floating Cart Bar */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-6 right-6 z-50 max-w-2xl mx-auto"
            >
              <button 
                onClick={() => router.push('/cart')}
                className="w-full bg-[#D4A843] text-[#0F172A] rounded-[12px] p-2 pl-6 flex items-center justify-between shadow-level-3 hover:bg-[#C29837] active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <ShoppingCart size={24} />
                    <span className="absolute -top-2 -right-2 bg-text-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#D4A843]">
                      {itemCount}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none">View Cart</p>
                    <p className="text-lg font-black tracking-tighter tabular-nums font-sans">৳{total().toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="bg-white/20 rounded-[8px] px-6 py-3 flex items-center gap-2 group-hover:bg-white/30 transition-colors">
                  <span className="text-sm font-black uppercase tracking-widest">কার্টে যান</span>
                  <ChevronRight size={18} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center pb-32 text-[10px] font-bold text-text-muted uppercase tracking-widest px-6">
          <p>&copy; 2026 Lucky Store Bangladesh</p>
          <p className="mt-2 opacity-50">Providing quality since 2012</p>
        </footer>
      </main>
  );
}
