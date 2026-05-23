"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "+8801234567890";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openWhatsApp = () => {
    const message = encodeURIComponent("Hi Lucky Store, I have a question about my order.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-bg-surface/95 backdrop-blur-md border-b border-border-subtle shadow-sm" : "bg-bg-surface"}`}>
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-text-primary leading-none font-bangla">লাকি স্টোর</span>
            <span className="text-[10px] font-bold text-text-muted tracking-widest uppercase mt-0.5">Chittagong Branch</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={openWhatsApp}
          className={cn(
            "w-10 h-10 rounded-full bg-green-50 border border-green-100 text-green-600 hover:bg-green-100 hover:text-green-700",
            "active:scale-95 shrink-0 shadow-none hover:shadow-none"
          )}
          aria-label="Chat on WhatsApp"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
