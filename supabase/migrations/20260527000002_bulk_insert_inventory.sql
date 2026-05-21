-- =============================================================================
-- Migration: Bulk Insert Inventory Items into Products
-- =============================================================================

-- Insert inventory items into products table
-- These items have different schema (name instead of name_en)
INSERT INTO public.products (
  id,
  tenant_id,
  name_en,
  sku,
  price,
  cost,
  stock_qty,
  is_active,
  reserved_online,
  created_at,
  updated_at
)
SELECT
  i.id,
  i.tenant_id,
  i.name as name_en,
  i.sku,
  0 as price,      -- Price will be set via price_lists
  0 as cost,
  100 as stock_qty, -- Default stock
  true as is_active,
  0 as reserved_online,
  COALESCE(i.created_at, now()) as created_at,
  now() as updated_at
FROM public.inventory_items i
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p WHERE p.id = i.id
)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  sku = EXCLUDED.sku,
  is_active = true,
  updated_at = now();

-- Verify the counts
SELECT
  'Inventory Items' as source,
  (SELECT COUNT(*) FROM public.inventory_items)::text as count
UNION ALL
SELECT
  'Products',
  (SELECT COUNT(*) FROM public.products)::text
UNION ALL
SELECT
  'Active Products',
  (SELECT COUNT(*) FROM public.products WHERE is_active = true)::text;
