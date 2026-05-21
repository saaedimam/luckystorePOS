-- =============================================================================
-- Migration: Fix Storefront Products Schema
-- Adds missing columns needed for customer storefront
-- =============================================================================

-- 1. Add is_active column to products if missing (storefront filters by this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    CREATE INDEX idx_products_is_active ON public.products(is_active);
  END IF;
END $$;

-- 2. Add reserved_online column to products if missing (stock reservation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'reserved_online'
  ) THEN
    ALTER TABLE public.products ADD COLUMN reserved_online INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Add image_url column to products if missing (storefront display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- 4. Ensure the guest read policy exists (for anonymous storefront access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'products_guest_read' AND tablename = 'products'
  ) THEN
    CREATE POLICY "products_guest_read" ON public.products
      FOR SELECT TO anon USING (is_active = true);
  END IF;
END $$;

-- 5. Update any existing products to have is_active = true if null
UPDATE public.products SET is_active = true WHERE is_active IS NULL;
UPDATE public.products SET reserved_online = 0 WHERE reserved_online IS NULL;

-- 6. Seed sample products if table is empty (for testing storefront)
INSERT INTO public.products (
  tenant_id, category_id, name_en, name_bn, sku, price, cost, stock_qty, is_active, image_url
)
SELECT
  t.id as tenant_id,
  NULL as category_id,
  'Sample Product' as name_en,
  'নমুনা পণ্য' as name_bn,
  'SAMPLE-001' as sku,
  100.00 as price,
  50.00 as cost,
  100 as stock_qty,
  true as is_active,
  NULL as image_url
FROM public.tenants t
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1)
ON CONFLICT (tenant_id, sku) DO NOTHING;
