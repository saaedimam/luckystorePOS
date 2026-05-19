import React, { useState } from 'react';

interface SaleSurfaceProps {
  todayTotal: number;
  onNewSale: (qty: number, method: 'Cash' | 'bKash' | 'Credit') => void;
  onEndShift: () => void;
  scannedProduct: { name: string; sku: string } | null;
  onClearScannedProduct: () => void;
}

export const SaleSurface: React.FC<SaleSurfaceProps> = ({
  todayTotal,
  onNewSale,
  onEndShift,
  scannedProduct,
  onClearScannedProduct,
}) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [qty, setQty] = useState(1);

  const triggerSale = (method: 'Cash' | 'bKash' | 'Credit') => {
    onNewSale(qty, method);
    setIsExpanding(false);
    setQty(1);
    onClearScannedProduct();
  };

  if (!isExpanding) {
    return (
      <div className="flex flex-col h-full w-full bg-transparent p-6 justify-center items-center relative">
        {/* End Shift Handoff button on the top right */}
        <button
          onClick={onEndShift}
          type="button"
          className="absolute top-4 right-4 min-h-[44px] px-4 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider border border-zinc-700 shadow-md transition-colors"
        >
          End Shift
        </button>

        <p className="text-zinc-500 font-mono tracking-widest uppercase text-sm mb-2">Today's Cash Total</p>
        <h1 className="text-7xl sm:text-8xl font-black tracking-tighter tabular-nums text-zinc-900">
          ৳{todayTotal.toLocaleString()}
        </h1>

        {/* Ambient Scanned Product Wedge Notification */}
        {scannedProduct && (
          <div className="mt-6 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-2 text-xs font-bold animate-pulse">
            <span>Scan Wedged: {scannedProduct.name}</span>
            <button
              onClick={onClearScannedProduct}
              type="button"
              className="text-[10px] bg-emerald-200 hover:bg-emerald-300 px-1.5 py-0.5 rounded text-emerald-900 ml-1 border-none"
            >
              Clear
            </button>
          </div>
        )}
        
        <button
          onClick={() => setIsExpanding(true)}
          className="absolute bottom-0 left-0 right-0 w-full bg-emerald-600 text-white min-h-[72px] text-2xl font-bold uppercase tracking-wider active:bg-emerald-700 transition-colors duration-75 border-none shadow-lg"
        >
          + New Sale {scannedProduct ? `(${scannedProduct.name})` : ''}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white animate-in slide-in-from-bottom-8 duration-150 relative z-30">
      <div className="p-4 bg-zinc-100 flex justify-between items-center border-b border-zinc-200">
        <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-800">
          Quick Sale {scannedProduct ? '— Wedged SKU' : ''}
        </h2>
        <button 
          onClick={() => {
            setIsExpanding(false);
            setQty(1);
          }}
          className="min-h-[48px] min-w-[64px] px-4 bg-zinc-200 text-zinc-800 font-bold hover:bg-zinc-300 active:bg-zinc-400"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center gap-10 max-w-md mx-auto w-full">
        {/* Wedge Details block */}
        {scannedProduct && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center text-xs">
            <div>
              <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-extrabold">Scanned Product</p>
              <h3 className="font-black text-emerald-950 mt-0.5">{scannedProduct.name}</h3>
            </div>
            <button
              onClick={onClearScannedProduct}
              type="button"
              className="text-[10px] px-2 py-1 bg-emerald-200 hover:bg-emerald-300 font-extrabold rounded text-emerald-900 border-none"
            >
              Clear SKU
            </button>
          </div>
        )}

        {/* Quantity Stepper */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-zinc-500">Item Quantity</span>
          <div className="flex items-center justify-between w-full bg-zinc-50 p-4 border-2 border-zinc-200">
            <button 
              onClick={() => setQty(Math.max(1, qty - 1))}
              type="button"
              className="min-h-[64px] min-w-[64px] bg-zinc-200 text-3xl font-extrabold active:bg-zinc-300 select-none flex items-center justify-center"
            >
              -
            </button>
            <span className="text-6xl font-black tabular-nums">{qty}</span>
            <button 
              onClick={() => setQty(qty + 1)}
              type="button"
              className="min-h-[64px] min-w-[64px] bg-zinc-200 text-3xl font-extrabold active:bg-zinc-300 select-none flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Giant Payment Methods */}
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase font-mono tracking-wider text-zinc-500 text-center">Select Payment Mode</span>
          
          <button 
            onClick={() => triggerSale('Cash')}
            type="button"
            className="min-h-[72px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-2xl font-bold uppercase tracking-wider border-none shadow"
          >
            CASH
          </button>
          
          <button 
            onClick={() => triggerSale('bKash')}
            type="button"
            className="min-h-[72px] bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-2xl font-bold uppercase tracking-wider border-none shadow"
          >
            bKash
          </button>

          <button 
            onClick={() => triggerSale('Credit')}
            type="button"
            className="min-h-[72px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-2xl font-bold uppercase tracking-wider border-none shadow"
          >
            CREDIT
          </button>
        </div>
      </div>
    </div>
  );
};
