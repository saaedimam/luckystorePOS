import { createClient } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ProductCatalog } from "@/components/ProductCatalog";
import { FloatingCartBar } from "@/components/FloatingCartBar";

export default async function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <HeroSection />
        <div className="px-4 pt-6 pb-2">
          <h2 className="text-lg font-bold text-gray-900 font-bangla">জনপ্রিয় পণ্য</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Popular Products</p>
        </div>
        <ProductCatalog />
      </main>
      <FloatingCartBar />
    </>
  );
}
