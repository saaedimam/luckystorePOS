'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PackageX, ShoppingCart, Loader2 } from 'lucide-react';
import { Product } from '@/types/product';
import { clsx } from 'clsx';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  disableNavigation?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  disableNavigation = false,
}) => {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const availableStock = (product.stock_qty || 0) - (product.reserved_online || 0);
  const isOutOfStock = availableStock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  const handleCardClick = () => {
    if (!disableNavigation) {
      router.push(`/product/${product.id}`);
    }
  };

  let badgeColor = 'bg-success-subtle text-success border-success/20';
  let stockText = `${availableStock} টি ইন-স্টক`;
  
  if (isOutOfStock) {
    badgeColor = 'bg-danger-subtle text-danger border-danger/20';
    stockText = 'স্টক শেষ';
  } else if (availableStock < 5) {
    badgeColor = 'bg-warning-subtle text-warning border-warning/20';
    stockText = `মাত্র ${availableStock} টি আছে`;
  } else if (availableStock <= 10) {
    badgeColor = 'bg-primary/15 text-primary border-primary/20';
    stockText = `আর ${availableStock} টি আছে`;
  }

  return (
    <motion.div
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -4,
        boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "group relative flex flex-col overflow-hidden bg-surface-default border border-border-default cursor-pointer",
        "w-full sm:w-[160px] md:w-[220px]", // Responsive width constraints
        "rounded-[12px]" // 12px border radius
      )}
    >
      {/* 1:1 Image Area */}
      <div className={clsx(
        "relative aspect-square w-full bg-background-subtle flex items-center justify-center overflow-hidden",
        isOutOfStock && "grayscale opacity-80"
      )}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name_en}
            fill
            sizes="(max-width: 640px) 160px, 220px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized
          />
        ) : (
          <ShoppingCart className="h-12 w-12 text-text-muted opacity-20" aria-hidden="true" />
        )}
        
        {/* Stock Badge */}
        <div className={clsx(
          "absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest border font-sans",
          badgeColor
        )}>
          {stockText}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 md:p-4">
        {/* Bangla Title - max 2 lines, Hind Siliguri, line-height 1.6 */}
        <div className="mb-2 min-h-[3.2rem]">
          <h3 
            className="font-bangla text-sm font-bold text-text-primary line-clamp-2 leading-[1.6]"
            title={product.name_bn || product.name_en}
          >
            {product.name_bn || product.name_en}
          </h3>
          <p className="text-[10px] text-text-muted truncate font-sans uppercase tracking-wider mt-0.5">
            {product.name_en}
          </p>
        </div>
        
        <div className="mt-auto pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Price (Inter for numerals, Tabular) */}
          <div className="text-lg md:text-xl font-black text-text-primary tabular-nums font-sans">
            ৳{product.price.toLocaleString('en-IN')}
          </div>

          {/* 44px Fixed Height Action Button */}
          <motion.button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            aria-label={isOutOfStock ? "Stock out" : `Add ${product.name_en} to cart`}
            whileTap={isOutOfStock ? undefined : { scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className={clsx(
              "flex h-[44px] w-full sm:w-[44px] items-center justify-center rounded-lg sm:rounded-full focus:outline-none focus:ring-2 focus:ring-primary",
              isOutOfStock
                ? 'bg-background-subtle text-text-muted cursor-not-allowed'
                : 'bg-primary text-primary-contrast hover:bg-primary-hover shadow-md'
            )}
          >
            {isAdding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isOutOfStock ? (
              <PackageX size={20} />
            ) : (
              <>
                <ShoppingCart size={20} className="sm:hidden mr-2" />
                <ShoppingCart size={20} className="hidden sm:block" />
                <span className="sm:hidden font-bold">Add</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

