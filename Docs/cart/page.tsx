import CartClient from './cart-client';

export const metadata = {
  title: 'Cart',
  description: 'Your shopping cart',
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-zinc-900 mb-8">
          Your Cart
        </h1>
        <CartClient />
      </div>
    </div>
  );
}

