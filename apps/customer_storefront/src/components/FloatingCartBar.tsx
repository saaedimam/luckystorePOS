"use client";
import { useState } from "react";
import { useCart } from "@/store/useCart";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function FloatingCartBar() {
  const { items, total, count, clearCart } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);
  if (count === 0) return null;

  return (
    <>
      {isExpanded && <div className="fixed inset-0 bg-black/20 z-40 animate-fade-in" onClick={() => setIsExpanded(false)} />}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl px-4 z-50">
        <div className={`bg-primary rounded-2xl shadow-primary overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[70vh]" : "max-h-[72px]"}`}>
          <div className="p-2 pl-4 pr-2 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-text-primary text-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count > 9 ? "9+" : count}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-0.5">{isExpanded ? "Tap to close" : "View Cart"}</span>
                <span className="text-sm font-extrabold text-text-primary tabular-nums leading-none">৳{total.toLocaleString("bn-BD")}</span>
              </div>
            </div>
            <Button
              size="sm"
              className={cn(
                "bg-black/10 hover:bg-black/20 text-text-primary rounded-xl font-bold text-sm flex items-center gap-2 font-bangla shrink-0",
                "border-0 shadow-none hover:shadow-none"
              )}
            >
              {isExpanded ? "চেকআউট" : "কার্টে যান"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </Button>
          </div>
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-black/10">
              <div className="max-h-[40vh] overflow-y-auto no-scrollbar py-3 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/50 rounded-lg flex items-center justify-center shrink-0"><span className="text-lg">🛒</span></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate font-bangla">{item.name_bn || item.name_en}</p>
                      <p className="text-xs text-text-secondary">৳{item.price.toLocaleString("bn-BD")} × {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-text-primary tabular-nums">৳{(item.price * item.quantity).toLocaleString("bn-BD")}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-black/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className={cn(
                    "flex-1 rounded-xl bg-black/10 hover:bg-black/20 text-text-primary font-bold text-xs font-bangla",
                    "border-0 shadow-none hover:shadow-none"
                  )}
                >
                  খালি করুন
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "flex-[2] rounded-xl bg-secondary hover:bg-secondary-hover text-primary font-bold text-sm font-bangla",
                    "border-0 shadow-none hover:shadow-none"
                  )}
                >
                  অর্ডার করুন
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
