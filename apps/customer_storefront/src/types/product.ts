export interface Product {
  id: string;
  name_en: string;
  name_bn?: string;
  price: number;
  image_url?: string;
  category_id?: string;
  stock_qty: number;
  reserved_online?: number;
  is_active?: boolean;
  tenant_id?: string;
  // Client-side computed properties
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
  stock_count?: number;
}

export interface CartItem extends Product {
  quantity: number;
}
