import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Browser/client-side client (for 'use client' components)
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

// Server-side client factory (used in API route handlers)
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    { auth: { persistSession: false } }
  );
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DeliveryZone {
  id: string;
  tenant_id: string;
  store_id: string | null;
  store_lat: number;
  store_lng: number;
  radius_km: number;
  delivery_fee: number;
  is_active: boolean;
}

export interface OnlineOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_address: string;
  customer_lat: number | null;
  customer_lng: number | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: 'cod';
  payment_status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface OnlineOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: {
    name_en: string;
    name_bn: string | null;
    image_url: string | null;
  };
}
