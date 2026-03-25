'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CheckoutFailContent() {
  const searchParams = useSearchParams();
  const tranId = searchParams.get('tran_id');
  const errorMsg = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight">Payment Failed</h1>
        <p className="text-zinc-600">
          Unfortunately, your payment could not be processed. Please try again.
        </p>
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-sm">
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}
        {tranId && (
          <div className="bg-zinc-50 p-4 rounded-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Transaction ID</p>
            <p className="text-sm font-mono font-bold mt-1">{tranId}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/cart"
            className="flex-1 bg-black text-white font-bold uppercase py-3 hover:bg-zinc-800 transition tracking-widest text-sm"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="flex-1 bg-zinc-100 text-black font-bold uppercase py-3 hover:bg-zinc-200 transition tracking-widest text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-50">
        <div className="text-center">
          <p className="text-zinc-600">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutFailContent />
    </Suspense>
  );
}

