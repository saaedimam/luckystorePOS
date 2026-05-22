-- =============================================================================
-- Migration: Sync inventory_items to products table for storefront
-- =============================================================================

-- Insert all inventory_items into products table
-- This creates storefront-ready products from the inventory
INSERT INTO public.products (
  id,
  tenant_id,
  category_id,
  name_en,
  name_bn,
  sku,
  price,
  cost,
  stock_qty,
  is_active,
  reserved_online,
  image_url,
  created_at,
  updated_at
)
SELECT
  i.id,
  i.tenant_id,
  NULL as category_id,  -- Can be linked later if categories exist
  i.name as name_en,
  NULL as name_bn,      -- Can be added manually later
  i.sku,
  0 as price,           -- Populated by 20260527000003_update_product_prices.sql
  0 as cost,
  COALESCE(sl.qty, 100) as stock_qty,  -- Default to 100 if no stock record
  true as is_active,
  0 as reserved_online,
  NULL as image_url,
  COALESCE(i.created_at, now()) as created_at,
  now() as updated_at
FROM public.inventory_items i
LEFT JOIN public.stock_levels sl ON sl.item_id = i.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p WHERE p.id = i.id
)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  sku = EXCLUDED.sku,
  price = EXCLUDED.price,
  cost = EXCLUDED.cost,
  stock_qty = EXCLUDED.stock_qty,
  is_active = true,
  updated_at = now();


-- Verify the sync
SELECT
  'Products in inventory_items' as check_item,
  (SELECT COUNT(*) FROM public.inventory_items)::text as count
UNION ALL
SELECT
  'Products now in products table',
  (SELECT COUNT(*) FROM public.products)::text
UNION ALL
SELECT
  'Active products',
  (SELECT COUNT(*) FROM public.products WHERE is_active = true)::text;
