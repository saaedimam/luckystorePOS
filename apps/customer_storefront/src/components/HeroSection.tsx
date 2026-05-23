"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface HeroSectionProps { onSearch?: (query: string) => void; }

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <section className="px-4 pt-8 pb-2 flex flex-col items-center">
      <div className="bg-bg-canvas rounded-[24px] py-8 px-6 text-center w-full mb-6 animate-slide-up">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 font-bangla leading-tight">প্রয়োজনীয় সবকিছু এক জায়গায়</h1>
        <p className="text-xs sm:text-sm text-text-muted font-medium">Fresh groceries & essentials delivered to your door.</p>
      </div>
      <div className="w-full relative group animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input type="text" value={searchQuery} onChange={handleSearch} placeholder="পণ্য খুঁজুন (Search products...)"
          className="w-full bg-bg-surface border border-gray-200 rounded-full py-3.5 pl-11 pr-4 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm font-bangla" />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSearchQuery(""); onSearch?.(""); }}
            className={cn(
              "absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600",
              "shadow-none hover:shadow-none bg-transparent hover:bg-transparent"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </Button>
        )}
      </div>
    </section>
  );
}
