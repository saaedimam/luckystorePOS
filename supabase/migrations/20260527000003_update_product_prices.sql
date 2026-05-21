-- =============================================================================
-- Migration: Update Product Prices from Price Lists
-- =============================================================================

-- Update products with prices from price_lists table
UPDATE public.products p
SET
  price = COALESCE(pl.price, 0),
  cost = COALESCE(pl.cost, 0)
FROM public.price_lists pl
WHERE p.id = pl.item_id
  AND p.price = 0;

-- Set default prices for products that still have no price
-- Using item_id pattern to set reasonable defaults based on category
UPDATE public.products
SET price = CASE
  WHEN sku LIKE 'RICE-%' THEN 200
  WHEN sku LIKE 'MILK-%' THEN 80
  WHEN sku LIKE 'EGGS-%' THEN 120
  WHEN sku LIKE 'VEG-%' THEN 50
  WHEN sku LIKE 'OIL-%' THEN 150
  WHEN sku LIKE 'PC-PEP-%' THEN 65    -- Pepsodent
  WHEN sku LIKE 'PC-SUN-%' THEN 180   -- Sunsilk
  WHEN sku LIKE 'PC-CLR-%' THEN 200   -- Clear
  WHEN sku LIKE 'PC-DOV-%' THEN 220   -- Dove
  WHEN sku LIKE 'PC-TRS-%' THEN 350   -- Tresemme
  WHEN sku LIKE 'PC-PND-%' THEN 120    -- Ponds
  WHEN sku LIKE 'PC-LFB-%' THEN 45    -- Lifebouy
  WHEN sku LIKE 'PC-LUX-%' THEN 55    -- Lux
  WHEN sku LIKE 'PC-CLU-%' THEN 90    -- Close Up
  WHEN sku LIKE 'BV-%' THEN 300       -- Beverages (Boost, Horlicks)
  WHEN sku LIKE 'PF-%' THEN 40         -- Food (Knorr)
  ELSE 50  -- Default for unknown categories
END,
cost = CASE
  WHEN sku LIKE 'RICE-%' THEN 150
  WHEN sku LIKE 'MILK-%' THEN 60
  WHEN sku LIKE 'EGGS-%' THEN 90
  WHEN sku LIKE 'VEG-%' THEN 35
  WHEN sku LIKE 'OIL-%' THEN 120
  WHEN sku LIKE 'PC-PEP-%' THEN 50
  WHEN sku LIKE 'PC-SUN-%' THEN 140
  WHEN sku LIKE 'PC-CLR-%' THEN 160
  WHEN sku LIKE 'PC-DOV-%' THEN 180
  WHEN sku LIKE 'PC-TRS-%' THEN 280
  WHEN sku LIKE 'PC-PND-%' THEN 90
  WHEN sku LIKE 'PC-LFB-%' THEN 35
  WHEN sku LIKE 'PC-LUX-%' THEN 40
  WHEN sku LIKE 'PC-CLU-%' THEN 70
  WHEN sku LIKE 'BV-%' THEN 250
  WHEN sku LIKE 'PF-%' THEN 30
  ELSE 35
END
WHERE price = 0;

-- Update stock quantities from stock_levels table
UPDATE public.products p
SET stock_qty = COALESCE(sl.qty, 100)
FROM public.stock_levels sl
WHERE p.id = sl.item_id
  AND p.stock_qty = 1000000000;  -- The default huge value from inventory sync

-- Verify the update
SELECT
  'Products with price = 0' as check_item,
  COUNT(*)::text as count
FROM public.products WHERE price = 0
UNION ALL
SELECT
  'Products with price > 0',
  COUNT(*)::text
FROM public.products WHERE price > 0
UNION ALL
SELECT
  'Average price',
  ROUND(AVG(price), 2)::text
FROM public.products;
