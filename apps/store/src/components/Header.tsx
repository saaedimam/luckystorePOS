"use client";

import Link from 'next/link';
import { ShoppingBag, Globe } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { useState } from 'react';

export default function Header() {
  const { getTotalItems, lang, toggleLang } = useCartStore();
  const [mounted, setMounted] = useState(true);

  return (
    <header className="sticky top-0 z-50 bg-bg-main/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-transform">
          <ShoppingBag size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-text-main uppercase">
            Lucky<span className="text-primary">Store</span>
          </h1>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLang}
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
        >
          <Globe size={14} />
          {lang === 'bn' ? 'EN' : 'BN'}
        </button>

        <Link href="/cart" className="relative p-2 text-text-main hover:text-primary transition-colors">
          <ShoppingBag size={24} />
          {mounted && getTotalItems() > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-bg-main">
              {getTotalItems()}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
