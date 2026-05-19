'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart, Product } from '@/store/useCart';
import { ShoppingCart, Plus, Minus, Search } from 'lucide-react';
import clsx from 'clsx';

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addItem, items, updateQuantity } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name_en');
      
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name_en.toLowerCase().includes(search.toLowerCase()) || 
    (p.name_bn && p.name_bn.includes(search))
  );

  if (loading) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input 
          type="text" 
          placeholder="পণ্য খুঁজুন (Search products...)" 
          className="w-full bg-surface-default border border-border-default rounded-full pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary-default/20 transition-all font-sans"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const cartItem = items.find(i => i.id === product.id);
          return (
            <div key={product.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group">
              <div className="aspect-square bg-background-subtle relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name_en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <ShoppingCart size={32} opacity={0.2} />
                  </div>
                )}
                {product.stock_qty <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white text-[10px] font-black uppercase tracking-widest bg-danger-default px-2 py-1 rounded">Stock Out</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-xs font-bold text-text-primary line-clamp-2 mb-1">{product.name_bn || product.name_en}</h3>
                <p className="text-[10px] text-text-secondary mb-3 font-sans truncate">{product.name_en}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-black text-text-primary">৳{product.price}</span>
                  {cartItem ? (
                    <div className="flex items-center gap-2 bg-primary-subtle rounded-full px-2 py-1 border border-primary-default/20">
                      <button onClick={() => updateQuantity(product.id, cartItem.quantity - 1)} className="text-primary-default p-0.5"><Minus size={12} /></button>
                      <span className="text-xs font-bold font-mono min-w-[12px] text-center">{cartItem.quantity}</span>
                      <button onClick={() => updateQuantity(product.id, cartItem.quantity + 1)} className="text-primary-default p-0.5"><Plus size={12} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addItem(product)}
                      disabled={product.stock_qty <= 0}
                      className="w-8 h-8 bg-primary-default text-primary-on rounded-full flex items-center justify-center hover:bg-primary-hover active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
