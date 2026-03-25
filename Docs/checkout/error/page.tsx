import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout Error — STRYV',
};

export default function ErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-black tracking-tight mb-4">
          Something Went Wrong
        </h1>

        <p className="text-zinc-700 mb-6">
          There was an issue while processing your request.  
          You can try again below.
        </p>

        <a
          href="/cart"
          className="inline-block px-6 py-3 bg-black text-white font-semibold tracking-wide rounded"
        >
          Go Back to Cart
        </a>
      </div>
    </main>
  );
}
