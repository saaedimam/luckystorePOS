import React from 'react';
import clsx from 'clsx';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  onSelect?: (id: string) => void;
  onQtyChange?: (id: string, qty: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onQtyChange: _onQtyChange }) => {
  const handleClick = () => {
    onSelect?.(product.id);
  };

  return (
    <div
      className={clsx(
        'border border-border-light rounded-xl p-4 shadow-card cursor-pointer hover:shadow-lg',
        'flex flex-col items-center text-center'
      )}
      onClick={handleClick}
    >
      {product.imageUrl && (
        <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover mb-2 rounded" />
      )}
      <h3 className="text-base font-medium text-text-main mb-1">{product.name}</h3>
      <p className="text-sm text-text-muted mb-2">${product.price.toFixed(2)}</p>
    </div>
  );
};
