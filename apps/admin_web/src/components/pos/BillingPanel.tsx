import React from 'react';

export interface BillingPanelProps {
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  onUpdate?: (items: any[]) => void;
  onCheckout?: () => void;
}

export const BillingPanel: React.FC<BillingPanelProps> = ({ items, onCheckout }) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-card p-4 shadow-card border border-border-light">
      <h2 className="text-lg font-semibold mb-4 text-text-main">Cart</h2>
      <div className="flex-1 overflow-y-auto mb-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center mb-2">
            <span className="text-sm text-text-main">{item.name}</span>
            <span className="text-sm text-text-muted">{item.quantity} x ${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border-light pt-2">
        <span className="font-medium text-text-main">Subtotal:</span>{' '}
        <span className="font-bold text-text-main">${subtotal.toFixed(2)}</span>
      </div>
      <button
        onClick={onCheckout}
        className="mt-4 w-full bg-primary text-white py-2 rounded-md hover:bg-primary-hover"
      >Checkout</button>
    </div>
  );
};
