'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { Product } from '@/types/product';
import { Search, Loader2 } from 'lucide-react';
import { ProductCardStacked } from './ProductCardStacked';
import { StorefrontSkeleton } from './ui/StorefrontSkeleton';
import { ToastContainer, useToast } from './ui/Toast';
import { SectionErrorBoundary } from './SectionErrorBoundary';

function ProductCatalogInner() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toasts, addToast, dismissToast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('[ProductCatalog] Fetching fresh data...');
        console.log('[ProductCatalog] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

        // Query products table with required fields
        const result = await supabase
          .from('products')
          .select('id, name_en, name_bn, price, stock_qty, reserved_online, image_url, category_id, is_active, tenant_id')
          .eq('is_active', true);

        if (result.error) {
          console.error('[ProductCatalog] Supabase error:', result.error);
          addToast({ messageBn: 'পণ্য লোড করতে সমস্যা হয়েছে', message: 'Failed to load products', type: 'error' });
        } else {
          const products = result.data || [];
          setProducts(products as Product[]);
        }
      } catch (err) {
        // Enhanced error logging - show full error details
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : '';
        const errorProps = JSON.stringify(err, Object.getOwnPropertyNames(err));

        logger.error('Exception in fetchProducts:', {
          error: errorMessage,
          stack: errorStack,
          fullError: errorProps
        });
        console.error('[ProductCatalog] Exception:', err);
        addToast({ messageBn: 'পণ্য লোড করতে সমস্যা হয়েছে', message: 'Failed to load products', type: 'error' });
      }
      setLoading(false);
    }
    fetchProducts();
  }, [addToast]);

  // Real-time stock sync (listening to products table)
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          console.log('[ProductCatalog] Real-time update:', payload);
          if (payload.new && payload.new.id) {
            setProducts((current) =>
              current.map((p) =>
                p.id === payload.new.id
                  ? {
                      ...p,
                      name_en: payload.new.name_en ?? p.name_en,
                      name_bn: payload.new.name_bn ?? p.name_bn,
                      stock_qty: payload.new.stock_qty ?? p.stock_qty,
                      reserved_online: payload.new.reserved_online ?? p.reserved_online,
                      is_active: payload.new.is_active ?? p.is_active,
                    }
                  : p
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('[ProductCatalog] Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name_en.toLowerCase().includes(search.toLowerCase()) ||
      (p.name_bn && p.name_bn.includes(search))
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-blue-500 font-mono mb-2">[NEW DESIGN v2 - Loading...]</p>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 p-3 bg-bg-surface rounded-xl border border-border-default">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-bg-subtle rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-bg-subtle rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-bg-subtle rounded w-1/2 animate-pulse" />
              <div className="flex justify-between items-center mt-auto">
                <div className="h-5 bg-bg-subtle rounded w-16 animate-pulse" />
                <div className="w-10 h-10 bg-bg-subtle rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="পণ্য খুঁজুন..."
            className="w-full bg-bg-surface border border-border-default rounded-xl pl-11 pr-4 py-3 text-sm font-bangla
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition-all placeholder:text-text-muted"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Product Count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {filteredProducts.length > 0 ? (
              <>
                <span className="font-bold text-text-primary">{filteredProducts.length}</span>টি পণ্য
              </>
            ) : (
              'কোন পণ্য পাওয়া যায়নি'
            )}
          </p>
        </div>

        {/* Single Column Product List */}
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <ProductCardStacked key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            {search ? (
              <div className="space-y-2">
                <p className="text-text-muted font-bangla text-sm">
                  &quot;{search}&quot; এর সাথে মিলে এমন কিছু পাওয়া যায়নি
                </p>
                <p className="text-xs text-text-muted">অন্য কিছু খুঁজুন</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-text-muted font-bangla text-base font-medium">পণ্য লোড হচ্ছে...</p>
                <p className="text-xs text-text-muted">অনুগ্রহ করে অপেক্ষা করুন</p>
              </div>
            )}
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
