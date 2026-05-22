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
  Share2,
  Store,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useCart } from '@/store/useCart';
import { Product } from '@/types/product';
import { clsx } from 'clsx';
import { ProductCardStacked } from '@/components/ProductCardStacked';
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
        .select('id, name_en, name_bn, price, stock_qty, reserved_online, image_url, category_id, is_active, tenant_id')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) {
        logger.error('Error fetching product:', error);
        console.error('[ProductDetail] Error:', error);
        setLoading(false);
        return;
      }

      setProduct(data);
      setLoading(false);

      // Fetch similar products from same category
      if (data?.category_id) {
        const { data: similar } = await supabase
          .from('products')
          .select('id, name_en, name_bn, price, stock_qty, reserved_online, image_url, category_id, is_active, tenant_id')
          .eq('category_id', data.category_id)
          .eq('is_active', true)
          .neq('id', productId)
          .limit(4);

        setSimilarProducts(similar || []);
      }
    }

    fetchProduct();
  }, [productId]);

  // Real-time stock sync (products table)
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
          console.log('[ProductDetail] Real-time update:', payload);
          if (payload.new) {
            setProduct((current) =>
              current
                ? {
                    ...current,
                    name_en: payload.new.name_en ?? current.name_en,
                    name_bn: payload.new.name_bn ?? current.name_bn,
                    stock_qty: payload.new.stock_qty ?? current.stock_qty,
                    reserved_online: payload.new.reserved_online ?? current.reserved_online,
                    is_active: payload.new.is_active ?? current.is_active,
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
    ? (product.stock_qty || 0) - (product.reserved_online || 0)
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

  // Cart item count
  const cartItemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const cartTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

  if (loading) {
    return <StorefrontSkeleton type="product-detail" />;
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-bg-canvas flex flex-col">
        <header className="sticky top-0 z-50 bg-bg-canvas/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-text-primary font-bangla">পণ্য বিবরণ</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <PackageX size={48} className="text-text-muted mb-4" />
          <h1 className="text-lg font-bold text-text-primary font-bangla mb-2">
            পণ্যটি পাওয়া যায়নি
          </h1>
          <p className="text-sm text-text-muted mb-6">
            এই পণ্যটি বিদ্যমান নয় বা স্টকে নেই।
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

  // Stock badge config
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  let stockText = 'স্টকে আছে';

  if (isOutOfStock) {
    badgeClass = 'bg-rose-50 text-rose-600 border-rose-100';
    stockText = 'স্টক শেষ';
  } else if (availableStock < 5) {
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
    stockText = `মাত্র ${availableStock} টি আছে`;
  }

  return (
    <main className="min-h-screen bg-bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-canvas/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>

        <h1 className="font-bangla text-sm font-bold text-text-primary line-clamp-1 px-4 flex-1 text-center">
          {product.name_bn || product.name_en}
        </h1>

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
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative aspect-square bg-bg-subtle overflow-hidden"
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
              <Store size={48} className="text-text-muted" />
            </div>
          )}

          {/* Stock Badge */}
          <div
            className={clsx(
              'absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-medium border',
              badgeClass
            )}
          >
            {stockText}
          </div>

          {/* Share Button */}
          <button
            className="absolute right-3 top-3 w-9 h-9 flex items-center justify-center bg-bg-surface/90 backdrop-blur-sm rounded-xl shadow-sm hover:bg-bg-surface transition-colors"
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
            <Share2 size={16} />
          </button>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 py-5"
        >
          {/* Price */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-text-primary tabular-nums">
              ৳{product.price.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              প্রতি ইউনিট
            </p>
          </div>

          {/* Product Name */}
          <h1 className="font-bangla text-lg font-bold text-text-primary mb-1 leading-snug">
            {product.name_bn || product.name_en}
          </h1>
          <p className="text-xs text-text-muted">
            {product.name_en}
          </p>

          {/* Divider */}
          <div className="h-px bg-[#E8E0D5] my-5" />

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="mb-5">
              <label className="text-sm font-medium text-text-primary mb-2 block font-bangla">
                পরিমাণ
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>

                <span className="w-10 text-center text-lg font-bold text-text-primary tabular-nums">
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={quantity >= maxQuantity}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-surface border border-border-default text-text-primary hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>

                <span className="text-xs text-text-muted ml-2">
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
                className="w-full bg-emerald-500 text-white rounded-xl h-12 flex items-center justify-center gap-2 font-bold"
              >
                <Check size={20} />
                <span className="font-bangla">কার্টে যোগ হয়েছে</span>
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
                  'w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95',
                  isOutOfStock
                    ? 'bg-bg-subtle text-text-muted cursor-not-allowed'
                    : 'bg-primary text-text-primary hover:bg-primary-hover shadow-sm'
                )}
              >
                {isOutOfStock ? (
                  <>
                    <PackageX size={20} />
                    <span className="font-bangla">স্টক শেষ</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    <span className="font-bangla">কার্টে যোগ করুন</span>
                    <span className="ml-1 px-2 py-0.5 bg-text-primary/10 rounded-lg text-sm">
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
            className="px-4 py-5 border-t border-border-default"
          >
            <h2 className="font-bangla text-base font-bold text-text-primary mb-3">
              একই ধরনের পণ্য
            </h2>

            <div className="space-y-3">
              {similarProducts.map((similarProduct) => (
                <ProductCardStacked
                  key={similarProduct.id}
                  product={similarProduct}
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
                  <span className="font-bangla">অর্ডার করুন</span>
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
