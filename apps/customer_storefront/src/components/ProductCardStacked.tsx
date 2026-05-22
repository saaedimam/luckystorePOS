'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PackageX, ShoppingCart, Loader2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/store/useCart';
import { Product } from '@/types/product';
import { clsx } from 'clsx';

interface ProductCardStackedProps {
  product: Product;
}

export const ProductCardStacked: React.FC<ProductCardStackedProps> = ({
  product,
}) => {
  const router = useRouter();
  const { addItem, updateQuantity, items } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const cartItem = items.find((i) => i.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const availableStock = (product.stock_qty || 0) - (product.reserved_online || 0);
  const isOutOfStock = availableStock <= 0;
  const canAddMore = quantityInCart < availableStock;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || !canAddMore) return;
    setIsAdding(true);
    addItem(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAddMore) return;
    addItem(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity - 1);
    }
  };

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  let stockBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  let stockText = 'স্টকে আছে';

  if (isOutOfStock) {
    stockBadgeClass = 'bg-rose-50 text-rose-600 border-rose-100';
    stockText = 'স্টক শেষ';
  } else if (availableStock < 5) {
    stockBadgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
    stockText = `মাত্র ${availableStock} টি`;
  }

  return (
    <motion.div
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group flex gap-3 p-3 bg-bg-surface rounded-xl border border-border-default hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.99]"
    >
      {/* Image - 1:1 Square */}
      <div
        className={clsx(
          'relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-bg-canvas rounded-lg overflow-hidden',
          isOutOfStock && 'grayscale opacity-70'
        )}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name_en}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-text-muted" />
          </div>
        )}

        {/* Stock Badge */}
        <div
          className={clsx(
            'absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded border',
            stockBadgeClass
          )}
        >
          {stockText}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title - Bangla First */}
        <h3
          className="font-bangla text-sm sm:text-base font-semibold text-text-primary line-clamp-2 leading-snug"
          title={product.name_bn || product.name_en}
        >
          {product.name_bn || product.name_en}
        </h3>
        <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 truncate">
          {product.name_en}
        </p>

        {/* Price and Action Row */}
        <div className="mt-auto flex items-center justify-between gap-2">
          {/* Price */}
          <div className="text-base sm:text-lg font-bold text-text-primary tabular-nums">
            ৳{product.price.toLocaleString('en-IN')}
          </div>

          {/* Add to Cart / Quantity Controls */}
          {quantityInCart > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 bg-primary rounded-xl p-1"
            >
              <button
                onClick={handleDecrement}
                className="w-7 h-7 flex items-center justify-center bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Minus size={14} strokeWidth={2.5} className="text-text-primary" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-text-primary">
                {quantityInCart}
              </span>
              <button
                onClick={handleIncrement}
                disabled={!canAddMore}
                className={clsx(
                  'w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
                  canAddMore
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'bg-white/10 cursor-not-allowed opacity-50'
                )}
              >
                <Plus size={14} strokeWidth={2.5} className="text-text-primary" />
              </button>
            </div>
          ) : (
            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              whileTap={isOutOfStock ? undefined : { scale: 0.9 }}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-colors',
                isOutOfStock
                  ? 'bg-bg-subtle text-text-muted cursor-not-allowed'
                  : 'bg-primary text-text-primary hover:bg-primary-hover shadow-sm'
              )}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isOutOfStock ? (
                <PackageX size={18} />
              ) : (
                <Plus size={20} strokeWidth={2.5} />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
