import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Successful — STRYV',
};

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { tran_id?: string };
}) {
  const tranId = searchParams.tran_id ?? 'unknown';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-black tracking-tight mb-4">
          Payment Successful
        </h1>

        <p className="text-zinc-700 mb-6">
          Your order has been confirmed.  
          Transaction ID:&nbsp;
          <span className="font-semibold">{tranId}</span>
        </p>

        <a
          href="/"
          className="inline-block px-6 py-3 bg-black text-white font-semibold tracking-wide rounded"
        >
          Continue Shopping
        </a>
      </div>
    </main>
  );
}
