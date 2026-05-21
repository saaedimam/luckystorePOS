'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ShoppingCart,
  Plus,
  Minus,
  PackageX,
  Check,
  ArrowRight,
  Heart,
  Share2,
  Store,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCart, Product } from '@/store/useCart';
import { clsx } from 'clsx';
import { ProductCard } from '@/components/ProductCard';
import { StorefrontSkeleton } from '@/components/ui/StorefrontSkeleton';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, items } = useCart();

  // Fetch product details
  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.error('Error fetching product:', error);
        setLoading(false);
        return;
      }

      setProduct(data);
      setLoading(false);

      // Fetch similar products from same category
      if (data?.category_id) {
        const { data: similar } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', data.category_id)
          .eq('is_active', true)
          .neq('id', productId)
          .limit(4);

        setSimilarProducts(similar || []);
      }
    }

    fetchProduct();
  }, [productId]);

  // Real-time stock sync
  useEffect(() => {
    if (!productId) return;

    const channel = supabase
      .channel(`product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setProduct((current) =>
              current
                ? {
                    ...current,
                    stock_qty: payload.new.stock_qty,
                    reserved_online: payload.new.reserved_online || 0,
                  }
                : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const availableStock = product
    ? product.stock_qty - (product.reserved_online || 0)
    : 0;
  const isOutOfStock = availableStock <= 0;
  const maxQuantity = Math.min(availableStock, 10);

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    // Add quantity times
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  // Stock badge config
  let badgeColor = 'bg-success-subtle text-success-default border-success-default/20';
  let stockText = 'ইন-স্টক';

  if (isOutOfStock) {
    badgeColor = 'bg-danger-subtle text-danger-default border-danger-default/20';
    stockText = 'স্টক শেষ';
  } else if (availableStock < 5) {
    badgeColor = 'bg-warning-subtle text-warning-dark border-warning-default/20';
    stockText = 'সীমিত স্টক';
  } else if (availableStock <= 10) {
    badgeColor = 'bg-primary-subtle text-primary-hover border-primary-default/20';
    stockText = 'স্টক ফুরিয়ে আসছে';
  }

  // Cart item count
  const cartItemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  if (loading) {
    return <StorefrontSkeleton type="product-detail" />;
  }

  if (!product) {
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
            পণ্যটি পাওয়া যায়নি
          </h1>
          <p className="text-text-secondary mb-6">
            এই পণ্যটি বিদ্যমান নয় বা স্টকে নেই।
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
      <header className="sticky top-0 z-50 bg-surface-default/80 backdrop-blur-lg border-b border-border-default px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-background-subtle rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>

        <h1 className="font-bangla text-base font-bold text-text-primary line-clamp-1 px-4">
          {product.name_bn || product.name_en}
        </h1>

        <div className="flex items-center gap-2">
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
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative aspect-square bg-background-subtle overflow-hidden"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name_en}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store size={64} className="text-text-muted opacity-20" />
            </div>
          )}

          {/* Stock Badge */}
          <div
            className={clsx(
              'absolute left-4 top-4 rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-widest border',
              badgeColor
            )}
          >
            {stockText}
          </div>

          {/* Share Button */}
          <button
            className="absolute right-4 top-4 p-2.5 bg-surface-default/90 backdrop-blur-sm rounded-full shadow-level-1 hover:bg-surface-default transition-colors"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: product.name_en,
                  text: `Check out ${product.name_en} at Lucky Store!`,
                  url: window.location.href,
                });
              }
            }}
            aria-label="Share product"
          >
            <Share2 size={18} />
          </button>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-6"
        >
          {/* Price */}
          <div className="mb-4">
            <p className="text-3xl font-black text-text-primary tabular-nums font-sans">
              ৳{product.price.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-text-muted mt-1">
              প্রতি ইউনিট / per unit
            </p>
          </div>

          {/* Product Name */}
          <h1 className="font-bangla text-xl font-bold text-text-primary mb-2 leading-relaxed">
            {product.name_bn || product.name_en}
          </h1>
          <p className="text-sm text-text-secondary uppercase tracking-wider">
            {product.name_en}
          </p>

          {/* Divider */}
          <div className="h-px bg-border-default my-6" />

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="mb-6">
              <label className="text-sm font-bold text-text-primary mb-3 block">
                পরিমাণ / Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-background-subtle border border-border-default text-text-primary hover:bg-background-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={20} />
                </button>

                <span className="w-12 text-center text-xl font-black text-text-primary tabular-nums">
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-background-subtle border border-border-default text-text-primary hover:bg-background-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={20} />
                </button>

                <span className="text-sm text-text-muted ml-2">
                  সর্বোচ্চ {maxQuantity}টি
                </span>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <AnimatePresence mode="wait">
            {addedToCart ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full bg-success-default text-success-on rounded-full h-14 flex items-center justify-center gap-2 font-bold"
              >
                <Check size={22} />
                <span>কার্টে যোগ হয়েছে</span>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={clsx(
                  'w-full h-14 rounded-full font-bold flex items-center justify-center gap-2 transition-all active:scale-95',
                  isOutOfStock
                    ? 'bg-background-subtle text-text-muted cursor-not-allowed'
                    : 'bg-primary-default text-primary-on hover:bg-primary-hover shadow-level-1'
                )}
              >
                {isOutOfStock ? (
                  <>
                    <PackageX size={22} />
                    <span>স্টক শেষ</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={22} />
                    <span>কার্টে যোগ করুন</span>
                    <span className="ml-2 px-2 py-0.5 bg-primary-on/10 rounded-full text-sm">
                      ৳{(product.price * quantity).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-4 py-6 border-t border-border-default"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bangla text-lg font-bold text-text-primary">
                একই বিভাগের পণ্য
              </h2>
              <span className="text-xs text-text-muted uppercase tracking-widest">
                Similar Products
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {similarProducts.map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  product={similarProduct}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Footer Spacer for Cart Bar */}
        <div className="h-24" />
      </div>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-50 max-w-lg mx-auto"
          >
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-[#D4A843] text-[#0F172A] rounded-[12px] p-2 pl-6 flex items-center justify-between shadow-level-3 hover:bg-[#C29837] active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ShoppingCart size={24} />
                  <span className="absolute -top-2 -right-2 bg-text-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#D4A843]">
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
              <div className="bg-white/20 rounded-[8px] px-6 py-3 flex items-center gap-2 group-hover:bg-white/30 transition-colors">
                <span className="text-sm font-black uppercase tracking-widest">
                  কার্টে যান
                </span>
                <ArrowRight size={18} />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
