'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCart, Product } from '@/store/useCart';
import { ShoppingCart, Search, Loader2 } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { StorefrontSkeleton } from './ui/StorefrontSkeleton';
import { ToastContainer, Toast, useToast } from './ui/Toast';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import clsx from 'clsx';

function ProductCatalogInner() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addItem, items, updateQuantity } = useCart();
  const { toasts, addToast, dismissToast } = useToast();

  const handleAddToCart = useCallback((product: Product) => {
    addItem(product);
    addToast({
      type: 'success',
      message: `Added ${product.name_en} to cart`,
      messageBn: `${product.name_bn || product.name_en} কার্টে যোগ হয়েছে`,
    });
  }, [addItem, addToast]);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name_en');
      
      if (error) {
        logger.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Real-time stock sync
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload.new && payload.new.id) {
            setProducts(current => current.map(p => 
              p.id === payload.new.id 
                ? { 
                    ...p, 
                    stock_qty: payload.new.stock_qty,
                    reserved_online: payload.new.reserved_online || 0
                  } 
                : p
            ));
          }
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredProducts = products.filter(p => 
    p.name_en.toLowerCase().includes(search.toLowerCase()) || 
    (p.name_bn && p.name_bn.includes(search))
  );

  if (loading) {
    return <StorefrontSkeleton type="card-grid" count={8} />;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="পণ্য খুঁজুন (Search products...)"
            className="w-full bg-surface-default border border-border-default rounded-full pl-12 pr-6 py-3 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/30 focus:border-[#D4A843] transition-all font-sans"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && search && (
          <div className="text-center py-20">
            <p className="text-text-muted font-bold">"{search}" এর সাথে মিলে এমন কিছু পাওয়া যায়নি।</p>
          </div>
        )}
      </div>
    </>
  );
}

// Export wrapped with error boundary
export function ProductCatalog() {
  return (
    <SectionErrorBoundary sectionName="ProductCatalog">
      <ProductCatalogInner />
    </SectionErrorBoundary>
  );
}
