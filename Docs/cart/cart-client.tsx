'use client';

import { Minus, Plus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartClient() {
  const { items, updateQuantity, cartTotal, removeFromCart } = useCart();

  const handleCheckout = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItems: items }),
      });

      const data = await response.json();
      
      if (data.ok && data.url) {
        // Redirect to SSLCommerz Checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <ShoppingBag className="w-16 h-16 text-zinc-300" aria-hidden="true" />
        <p className="text-zinc-500 text-lg">Your cart is empty.</p>
        <Link
          href="/"
          className="text-black font-bold uppercase text-sm underline hover:text-zinc-600 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {items.map(item => (
          <div key={item.id} className="flex gap-4 pb-6 border-b border-zinc-200">
            <div className="w-24 h-32 md:w-32 md:h-40 bg-zinc-100 rounded-sm overflow-hidden flex-shrink-0 relative">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 96px, 128px"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base md:text-lg uppercase tracking-tight text-zinc-900">
                  {item.name}
                </h3>
                <p className="text-xs md:text-sm text-zinc-500 uppercase tracking-wide mt-1">
                  {item.category}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 border border-zinc-200 rounded-sm px-3 py-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:text-black text-zinc-400 transition"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 hover:text-black text-zinc-400 transition"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-col items-end">
                  <p className="font-bold text-lg text-zinc-900">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline mt-1"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-200 pt-6 space-y-6">
        <div className="flex items-center justify-between text-base">
          <span className="uppercase tracking-wide text-zinc-500 font-semibold">Subtotal</span>
          <span className="font-bold text-2xl text-zinc-900">
            ৳{cartTotal.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 text-center bg-zinc-100 text-black font-bold uppercase py-4 hover:bg-zinc-200 transition tracking-widest text-sm"
          >
            Continue Shopping
          </Link>
          <button
            onClick={handleCheckout}
            className="flex-1 bg-black text-white font-bold uppercase py-4 hover:bg-zinc-800 transition tracking-widest text-sm"
          >
            Checkout
          </button>
        </div>
        <div className="flex justify-center pt-2">
          <a
            href="https://www.sslcommerz.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="SSLCommerz"
            className="inline-block"
          >
            <Image
              src="https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-05.png"
              alt="SSLCommerz"
              width={300}
              height={60}
              className="h-auto max-w-[200px] opacity-60 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

