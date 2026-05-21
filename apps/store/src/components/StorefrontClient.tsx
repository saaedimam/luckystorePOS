"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/store';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface StockLevel {
  qty: number;
  qty_reserved_online: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductWithStock {
  id: string;
  name_en: string;
  name_bn: string | null;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  categories: { name: string } | null; // Joined category object
  stock_levels: StockLevel[];
}

export default function StorefrontClient({ initialProducts, categories }: { initialProducts: ProductWithStock[], categories: Category[] }) {
  const [products, setProducts] = useState<ProductWithStock[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { lang, addItem } = useCartStore();

  useEffect(() => {
    // POS sales deduct from stock_levels — subscribe there, not on products
    const channel = supabase
      .channel('stock_levels:changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stock_levels' },
        (payload) => {
          const updated = payload.new as { item_id: string; qty: number; qty_reserved_online: number };
          setProducts(current =>
            current.map(p => {
              if (p.id !== updated.item_id) return p;
              return {
                ...p,
                stock_levels: [
                  {
                    qty: updated.qty ?? 0,
                    qty_reserved_online: updated.qty_reserved_online ?? 0,
                  },
                ],
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    if (!p.stock_levels || p.stock_levels.length === 0) return false;
    const stock = p.stock_levels[0];
    const available = stock.qty - (stock.qty_reserved_online || 0);
    if (available <= 0) return false;
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-6">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-black uppercase tracking-widest transition-colors ${!selectedCategory ? 'bg-primary text-white' : 'bg-bg-card text-text-muted hover:text-text-main'}`}
        >
          {lang === 'bn' ? 'সব' : 'All'}
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-black uppercase tracking-widest transition-colors ${selectedCategory === c.id ? 'bg-primary text-white' : 'bg-bg-card text-text-muted hover:text-text-main'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(p => {
          const stock = p.stock_levels && p.stock_levels.length > 0 ? p.stock_levels[0] : { qty: 0, qty_reserved_online: 0 };
          const available = stock.qty - (stock.qty_reserved_online || 0);
          const isLowStock = available <= 5;
          
          return (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={p.id} 
              className="bg-bg-card border border-white/5 rounded-2xl p-4 flex flex-col justify-between shadow-xl shadow-black/40 relative overflow-hidden"
            >
              {isLowStock && (
                <div className="absolute top-0 right-0 bg-danger text-white text-[10px] font-black px-2 py-1 rounded-bl-xl z-10">
                  {lang === 'bn' ? 'স্টক কম' : 'LOW STOCK'}
                </div>
              )}
              
              <div className="mb-4">
                {/* Image placeholder since imageUrl isn't in core schema but may be added */}
                <div className="w-full aspect-square bg-bg-accent rounded-xl mb-3 flex items-center justify-center text-text-dim">
                  IMG
                </div>
                <h3 className="font-bold text-text-main leading-tight line-clamp-2">
                  {lang === 'bn' ? (p.name_bn || p.name_en) : p.name_en}
                </h3>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="font-black text-lg text-primary tabular-nums">
                  ৳{p.price}
                </span>
                <button
                  onClick={() => addItem({ product_id: p.id, name: lang === 'bn' ? (p.name_bn || p.name_en) : p.name_en, price: p.price, quantity: 1, max_stock: available })}
                  className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          {lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
        </div>
      )}
    </div>
  );
}
