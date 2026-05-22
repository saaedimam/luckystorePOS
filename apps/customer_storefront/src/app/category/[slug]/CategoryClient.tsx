'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ShoppingCart,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  PackageX,
  Grid3X3,
  List,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCart } from '@/store/useCart';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardStacked } from '@/components/ProductCardStacked';
import { StorefrontSkeleton } from '@/components/ui/StorefrontSkeleton';
import { clsx } from 'clsx';

interface Category {
  id: string;
  name: string;
  category: string;
  color?: string;
  icon?: string;
  image_url?: string;
}

type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'stock_desc';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  const { addItem, items } = useCart();

  const cartItemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  // Fetch category and products
  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      setLoading(true);

      // Fetch category by slug
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('category', slug)
        .single();

      if (categoryError) {
        logger.error('Error fetching category:', categoryError);
        setLoading(false);
        return;
      }

      setCategory(categoryData);

      // Fetch products in this category (from products table)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name_en, name_bn, price, stock_qty, reserved_online, image_url, category_id, is_active, tenant_id')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      if (productsError) {
        logger.error('Error fetching products:', productsError);
        console.error('[Category] Error fetching products:', productsError);
      } else {
        setProducts(productsData || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  // Real-time stock sync (products table)
  useEffect(() => {
    if (!category?.id) return;

    const channel = supabase
      .channel('category-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          console.log('[Category] Real-time update:', payload);
          if (payload.new && payload.new.category_id === category.id) {
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
        console.log('[Category] Real-time subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category?.id]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name_en.toLowerCase().includes(query) ||
          (p.name_bn && p.name_bn.includes(query))
      );
    }

    // Stock filter
    if (stockFilter === 'in_stock') {
      result = result.filter((p) => (p.stock_qty || 0) - (p.reserved_online || 0) > 0);
    } else if (stockFilter === 'low_stock') {
      result = result.filter(
        (p) => {
          const available = (p.stock_qty || 0) - (p.reserved_online || 0);
          return available > 0 && available < 5;
        }
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name_asc':
          return a.name_en.localeCompare(b.name_en);
        case 'stock_desc':
          return ((b.stock_qty || 0) - (b.reserved_online || 0)) - ((a.stock_qty || 0) - (a.reserved_online || 0));
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, sortBy, stockFilter]);

  const inStockCount = products.filter(
    (p) => (p.stock_qty || 0) - (p.reserved_online || 0) > 0
  ).length;

  const lowStockCount = products.filter(
    (p) => {
      const available = (p.stock_qty || 0) - (p.reserved_online || 0);
      return available > 0 && available < 5;
    }
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-canvas">
        <header className="sticky top-0 z-50 bg-bg-canvas/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-bg-subtle rounded-xl animate-pulse" />
          <div className="h-4 w-24 bg-bg-subtle rounded animate-pulse" />
        </header>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 bg-bg-surface rounded-xl border border-border-default">
              <div className="w-20 h-20 bg-bg-subtle rounded-lg animate-pulse" />
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
      </main>
    );
  }

  if (!category) {
    return (
      <main className="min-h-screen bg-bg-canvas flex flex-col">
        <header className="sticky top-0 z-50 bg-bg-canvas/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-text-primary">বিভাগ</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <PackageX size={48} className="text-text-muted mb-4" />
          <h1 className="text-lg font-bold text-text-primary font-bangla mb-2">
            বিভাগটি পাওয়া যায়নি
          </h1>
          <p className="text-sm text-text-muted mb-6">
            এই বিভাগটি বিদ্যমান নয়।
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary text-text-primary rounded-xl font-bold hover:bg-primary-hover transition-colors"
          >
            স্টোরে ফিরে যান
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-canvas/95 backdrop-blur-sm border-b border-border-default">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-bangla text-base font-bold text-text-primary">
                {category.name}
              </h1>
              <p className="text-xs text-text-muted">
                {filteredProducts.length}টি পণ্য
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/cart')}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle transition-colors"
            aria-label="View cart"
          >
            <ShoppingCart size={18} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-text-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="এই বিভাগে পণ্য খুঁজুন..."
              className="w-full bg-bg-surface border border-border-default rounded-xl pl-11 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-text-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-subtle rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X size={14} className="text-text-muted" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-border-default bg-bg-surface">
        <div className="flex items-center justify-between gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-sm font-medium text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="name_asc">নাম অনুযায়ী</option>
              <option value="price_asc">দাম: কম থেকে বেশি</option>
              <option value="price_desc">দাম: বেশি থেকে কম</option>
              <option value="stock_desc">স্টক অনুযায়ী</option>
            </select>
          </div>

          {/* View Mode & Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                showFilters
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-bg-subtle text-text-muted'
              )}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={18} />
            </button>

            <div className="w-px h-5 bg-border-default" />

            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-bg-subtle text-text-muted'
              )}
              aria-label="Grid view"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-bg-subtle text-text-muted'
              )}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pt-3 mt-3 border-t border-border-default"
          >
            <p className="text-xs font-medium text-text-muted mb-2">
              স্টক ফিল্টার
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStockFilter('all')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  stockFilter === 'all'
                    ? 'bg-primary text-text-primary'
                    : 'bg-bg-subtle text-text-muted hover:bg-border-default'
                )}
              >
                সব ({products.length})
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  stockFilter === 'in_stock'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-bg-subtle text-text-muted hover:bg-border-default'
                )}
              >
                স্টকে আছে ({inStockCount})
              </button>
              <button
                onClick={() => setStockFilter('low_stock')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  stockFilter === 'low_stock'
                    ? 'bg-amber-500 text-white'
                    : 'bg-bg-subtle text-text-muted hover:bg-border-default'
                )}
              >
                সীমিত স্টক ({lowStockCount})
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Products */}
      <div className="p-4 max-w-2xl mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <PackageX size={40} className="text-text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-text-primary font-bangla mb-1">
              কোন পণ্য পাওয়া যায়নি
            </h3>
            <p className="text-sm text-text-muted mb-4">
              {searchQuery
                ? `"${searchQuery}"-এর সাথে মিলে এমন কিছু পাওয়া যায়নি।`
                : 'এই ফিল্টারে কোন পণ্য নেই।'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                সার্চ ক্লিয়ার করুন
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addItem}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductCardStacked
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Spacer */}
      <div className="h-24" />

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-bg-subtle via-bg-canvas to-transparent"
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-primary text-text-primary rounded-2xl py-3.5 px-4 flex items-center justify-between shadow-lg shadow-primary/25 hover:bg-primary-hover active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={22} strokeWidth={2} />
                  <span className="absolute -top-2 -right-2 bg-text-primary text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-medium opacity-80 leading-none mb-0.5">
                    আপনার কার্ট
                  </p>
                  <p className="text-base font-bold tabular-nums leading-none">
                    ৳{cartTotal.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold">
                <span className="font-bangla">কার্টে যান</span>
                <ChevronLeft className="rotate-180" size={16} />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </main>
  );
}
