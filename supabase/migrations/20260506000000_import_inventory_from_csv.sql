-- =============================================================================
-- Inventory Import from CSV: Lucky Store Inventory with images
-- Store ID: 4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd
-- Products: ~533 items
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Import function that reads from a temp table
-- Run this after loading CSV data via Supabase dashboard or psql
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('temp_inventory_import') IS NOT NULL THEN
    -- First, ensure categories exist
    INSERT INTO public.categories (id, name, description, created_at, updated_at)
    SELECT
      uuid_generate_v4(),
      x.category,
      x.category || ' products',
      NOW(),
      NOW()
    FROM (
      SELECT DISTINCT ON (category) category
      FROM temp_inventory_import
      WHERE category IS NOT NULL
      ORDER BY category
    ) x
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.name = x.category
    );

    -- Insert items with their categories
    INSERT INTO public.items (
      id,
      sku,
      name,
      description,
      brand,
      category_id,
      price,
      cost,
      image_url,
      short_code,
      barcode,
      active,
      created_at,
      updated_at
    )
    SELECT
      uuid_generate_v4(),
      t."Item Code",
      t."Item Name",
      COALESCE(NULLIF(t.Description, ''), t."Item Name"),
      t.Brand,
      c.id,
      t."Sales Price"::numeric,
      t."Purchase Price"::numeric,
      t."Image URL",
      LEFT(t."Item Code", 8),
      t."Item Code",
      true,
      NOW(),
      NOW()
    FROM temp_inventory_import t
    LEFT JOIN public.categories c ON c.name = t.Category
    ON CONFLICT (sku) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      brand = EXCLUDED.brand,
      category_id = EXCLUDED.category_id,
      price = EXCLUDED.price,
      cost = EXCLUDED.cost,
      image_url = EXCLUDED.image_url,
      short_code = EXCLUDED.short_code,
      barcode = EXCLUDED.barcode,
      updated_at = NOW();

    -- Insert stock levels for the store
    INSERT INTO public.stock_levels (
      store_id,
      item_id,
      qty,
      reserved
    )
    SELECT
      '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd'::uuid,
      i.id,
      COALESCE(t."Opening Stock"::integer, 0),
      COALESCE(t."Low Stock"::integer, 5)
    FROM temp_inventory_import t
    JOIN public.items i ON i.sku = t."Item Code"
    ON CONFLICT (store_id, item_id) DO UPDATE SET
      qty = EXCLUDED.qty,
      reserved = EXCLUDED.reserved;

    -- Clean up temp table
    DROP TABLE IF EXISTS temp_inventory_import;
  END IF;
END $$;

-- Verify import
SELECT
  'Categories created:' as info,
  COUNT(*) as count
FROM public.categories
UNION ALL
SELECT
  'Items created:' as info,
  COUNT(*) as count
FROM public.items
UNION ALL
SELECT
  'Stock levels created:' as info,
  COUNT(*) as count
FROM public.stock_levels
WHERE store_id = '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd';
