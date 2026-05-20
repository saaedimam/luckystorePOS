import StorefrontClient from '@/components/StorefrontClient';
import LocationGuard from '@/components/LocationGuard';
import { supabase } from '@/lib/supabase';

export const revalidate = 0; // Disable cache for real-time stock

interface StockLevel {
  qty: number;
  qty_reserved_online: number;
}

interface Category {
  name: string;
}

interface ProductWithStock {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  categories: Category;
  stock_levels: StockLevel[];
}

export default async function StorefrontPage() {
  
  // Fetch products and left join stock_levels
  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name), stock_levels(qty, qty_reserved_online)');

  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  // Filter out items with no stock
  const availableProducts = (products || []).filter((p: ProductWithStock) => {
    if (!p.stock_levels || p.stock_levels.length === 0) return false;
    const stock = p.stock_levels[0];
    const available = stock.qty - (stock.qty_reserved_online || 0);
    return available > 0;
  });

  return (
    <LocationGuard>
      <StorefrontClient initialProducts={availableProducts} categories={categories || []} />
    </LocationGuard>
  );
}
