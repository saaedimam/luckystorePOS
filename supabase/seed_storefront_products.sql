-- =============================================================================
-- SEED & FIX: Storefront Products Setup
-- Run this in Supabase Dashboard SQL Editor
-- =============================================================================

-- 1. Add missing columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS reserved_online INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 3. Create RLS policy for anonymous (guest) read access
-- This allows the storefront to display products without login
DROP POLICY IF EXISTS "products_guest_read" ON public.products;
CREATE POLICY "products_guest_read" ON public.products
  FOR SELECT TO anon USING (is_active = true);

-- 4. Update existing products to have is_active = true
UPDATE public.products SET is_active = true WHERE is_active IS NULL;
UPDATE public.products SET reserved_online = 0 WHERE reserved_online IS NULL;

-- 5. Seed sample products if table is empty
-- First, get a valid tenant_id
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'No tenant found. Creating a default tenant...';
    INSERT INTO public.tenants (id, name, slug)
    VALUES (gen_random_uuid(), 'Default Store', 'default-store')
    RETURNING id INTO v_tenant_id;
  END IF;

  -- Insert sample products if none exist
  IF NOT EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
    INSERT INTO public.products (tenant_id, name_en, name_bn, sku, price, cost, stock_qty, is_active)
    VALUES
      (v_tenant_id, 'Premium Basmati Rice 5kg', 'প্রিমিয়াম বাসমতি চাল ৫ কেজি', 'RICE-BAS-001', 420.00, 350.00, 100, true),
      (v_tenant_id, 'Fresh Milk 1L', 'তাজা দুধ ১ লিটার', 'MILK-001', 85.00, 70.00, 50, true),
      (v_tenant_id, 'Eggs (12 pcs)', 'ডিম (১২টি)', 'EGGS-001', 140.00, 110.00, 200, true),
      (v_tenant_id, 'Potatoes 1kg', 'আলু ১ কেজি', 'VEG-001', 45.00, 30.00, 300, true),
      (v_tenant_id, 'Onions 1kg', 'পেয়াজ ১ কেজি', 'VEG-002', 65.00, 45.00, 250, true),
      (v_tenant_id, 'Cooking Oil 1L', 'খাবার তেল ১ লিটার', 'OIL-001', 180.00, 140.00, 80, true),
      (v_tenant_id, 'Sugar 1kg', 'চিনি ১ কেজি', 'SUGAR-001', 75.00, 60.00, 150, true),
      (v_tenant_id, 'Salt 1kg', 'লবণ ১ কেজি', 'SALT-001', 35.00, 25.00, 200, true);
  END IF;
END $$;

-- 6. Verify the setup
SELECT
  'Products count' as check_item,
  COUNT(*)::text as result
FROM public.products
UNION ALL
SELECT
  'Active products',
  COUNT(*)::text
FROM public.products
WHERE is_active = true
UNION ALL
SELECT
  'RLS Policy exists',
  EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'products_guest_read')::text
UNION ALL
SELECT
  'is_active column exists',
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active')::text;
