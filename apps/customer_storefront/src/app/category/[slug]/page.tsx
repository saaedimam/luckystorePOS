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
import { useCart, Product } from '@/store/useCart';
import { ProductCard } from '@/components/ProductCard';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

      // Fetch products in this category
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      if (productsError) {
        logger.error('Error fetching products:', productsError);
      } else {
        setProducts(productsData || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [slug]);

  // Real-time stock sync
  useEffect(() => {
    if (!category?.id) return;

    const channel = supabase
      .channel('category-products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload.new && payload.new.category_id === category.id) {
            setProducts((current) =>
              current.map((p) =>
                p.id === payload.new.id
                  ? {
                      ...p,
                      stock_qty: payload.new.stock_qty,
                      reserved_online: payload.new.reserved_online || 0,
                    }
                  : p
              )
            );
          }
        }
      )
      .subscribe();

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
      result = result.filter((p) => p.stock_qty - (p.reserved_online || 0) > 0);
    } else if (stockFilter === 'low_stock') {
      result = result.filter(
        (p) => {
          const available = p.stock_qty - (p.reserved_online || 0);
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
          return (b.stock_qty - (b.reserved_online || 0)) - (a.stock_qty - (a.reserved_online || 0));
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, sortBy, stockFilter]);

  const inStockCount = products.filter(
    (p) => p.stock_qty - (p.reserved_online || 0) > 0
  ).length;

  const lowStockCount = products.filter(
    (p) => {
      const available = p.stock_qty - (p.reserved_online || 0);
      return available > 0 && available < 5;
    }
  ).length;

  if (loading) {
    return <StorefrontSkeleton type="page" count={6} />;
  }

  if (!category) {
    return (
      <main className="min-h-screen bg-background-default flex flex-col">
        <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-background-subtle rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <PackageX size={64} className="text-text-muted mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">
            বিভাগটি পাওয়া যায়নি
          </h1>
          <p className="text-text-secondary mb-6">
            এই বিভাগটি বিদ্যমান নয়।
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-default text-primary-on rounded-full font-bold hover:bg-primary-hover transition-colors"
          >
            স্টোরে ফিরে যান
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-default">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-background-subtle rounded-full transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="font-bangla text-lg font-bold text-text-primary">
                {category.name}
              </h1>
              <p className="text-xs text-text-muted">
                {filteredProducts.length}টি পণ্য
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/cart')}
            className="relative p-2 hover:bg-background-subtle rounded-full transition-colors"
            aria-label="View cart"
          >
            <ShoppingCart size={22} />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary-default text-primary-on text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="এই বিভাগে পণ্য খুঁজুন..."
              className="w-full bg-background-subtle border border-border-default rounded-full pl-12 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-primary-default/30 focus:border-primary-default transition-all font-sans text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-background-default rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="px-4 py-3 border-b border-border-default bg-surface-default">
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
                  ? 'bg-primary-default/10 text-primary-default'
                  : 'hover:bg-background-subtle text-text-muted'
              )}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={18} />
            </button>

            <div className="w-px h-6 bg-border-default" />

            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-default/10 text-primary-default'
                  : 'hover:bg-background-subtle text-text-muted'
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
                  ? 'bg-primary-default/10 text-primary-default'
                  : 'hover:bg-background-subtle text-text-muted'
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
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
              স্টক ফিল্টার
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStockFilter('all')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                  stockFilter === 'all'
                    ? 'bg-primary-default text-primary-on'
                    : 'bg-background-subtle text-text-secondary hover:bg-background-default'
                )}
              >
                সব ({products.length})
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                  stockFilter === 'in_stock'
                    ? 'bg-success-default text-success-on'
                    : 'bg-background-subtle text-text-secondary hover:bg-background-default'
                )}
              >
                স্টকে আছে ({inStockCount})
              </button>
              <button
                onClick={() => setStockFilter('low_stock')}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                  stockFilter === 'low_stock'
                    ? 'bg-warning-default text-warning-on'
                    : 'bg-background-subtle text-text-secondary hover:bg-background-default'
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
          <div className="text-center py-20">
            <PackageX size={48} className="text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">
              কোন পণ্য পাওয়া যায়নি
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {searchQuery
                ? `"${searchQuery}"-এর সাথে মিলে এমন কিছু পাওয়া যায়নি।`
                : 'এই ফিল্টারে কোন পণ্য নেই।'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-primary-default/10 text-primary-default rounded-full text-sm font-bold hover:bg-primary-default/20 transition-colors"
              >
                সার্চ ক্লিয়ার করুন
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
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
              <ListProductCard
                key={product.id}
                product={product}
                onAddToCart={addItem}
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
          className="fixed bottom-6 left-6 right-6 z-50 max-w-lg mx-auto"
        >
          <button
            onClick={() => router.push('/cart')}
            className="w-full bg-primary-default text-primary-on rounded-xl p-2 pl-6 flex items-center justify-between shadow-level-3 hover:bg-primary-hover active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-text-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary-default">
                  {cartItemCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none">
                  View Cart
                </p>
                <p className="text-lg font-black tracking-tighter tabular-nums font-sans">
                  ৳{cartTotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg px-6 py-3 flex items-center gap-2 group-hover:bg-white/30 transition-colors">
              <span className="text-sm font-black uppercase tracking-widest">
                কার্টে যান
              </span>
              <ChevronLeft className="rotate-180" size={18} />
            </div>
          </button>
        </motion.div>
      )}
    </main>
  );
}

// List View Product Card
interface ListProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ListProductCard({ product, onAddToCart }: ListProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = React.useState(false);

  const availableStock = product.stock_qty - (product.reserved_online || 0);
  const isOutOfStock = availableStock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className="flex items-center gap-4 p-3 bg-surface-default border border-border-default rounded-xl hover:shadow-level-1 transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="w-20 h-20 bg-background-subtle rounded-lg flex-shrink-0 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_en}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageX size={24} className="text-text-muted opacity-30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bangla text-sm font-bold text-text-primary truncate">
          {product.name_bn || product.name_en}
        </h3>
        <p className="text-xs text-text-muted truncate">{product.name_en}</p>
        <p className="text-lg font-black text-text-primary tabular-nums font-sans mt-1">
          ৳{product.price.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={isOutOfStock || isAdding}
        className={clsx(
          'w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95',
          isOutOfStock
            ? 'bg-background-subtle text-text-muted cursor-not-allowed'
            : 'bg-primary-default text-primary-on hover:bg-primary-hover'
        )}
      >
        {isAdding ? (
          <span className="animate-spin">⟳</span>
        ) : isOutOfStock ? (
          <PackageX size={18} />
        ) : (
          <span className="text-lg font-bold">+</span>
        )}
      </button>
    </div>
  );
}
