import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Failed — STRYV',
};

export default function FailedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-black tracking-tight mb-4">
          Payment Failed
        </h1>

        <p className="text-zinc-700 mb-6">
          Your payment could not be completed.  
          Please try again or use a different payment method.
        </p>

        <a
          href="/cart"
          className="inline-block px-6 py-3 bg-black text-white font-semibold tracking-wide rounded"
        >
          Return to Cart
        </a>
      </div>
    </main>
  );
}
