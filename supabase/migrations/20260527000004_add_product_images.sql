-- =============================================================================
-- Migration: Add Product Images
-- =============================================================================

-- Update products with placeholder images based on SKU/category patterns
-- Using placeholder service with category-specific colors

UPDATE public.products
SET image_url = CASE
  -- Rice category (orange/brown)
  WHEN sku LIKE 'RICE-%' OR name_en ILIKE '%rice%' OR name_en ILIKE '%rice%'
    THEN '/images/products/rice.svg'

  -- Dairy/Milk (blue)
  WHEN sku LIKE 'MILK-%' OR name_en ILIKE '%milk%' OR name_en ILIKE '%dairy%'
    THEN '/images/products/milk.svg'

  -- Eggs (yellow/orange)
  WHEN sku LIKE 'EGGS-%' OR name_en ILIKE '%egg%'
    THEN '/images/products/eggs.svg'

  -- Vegetables (green)
  WHEN sku LIKE 'VEG-%' OR name_en ILIKE '%potato%' OR name_en ILIKE '%onion%'
    OR name_en ILIKE '%vegetable%' OR name_en ILIKE '%carrot%' OR name_en ILIKE '%tomato%'
    THEN '/images/products/vegetables.svg'

  -- Cooking Oil (yellow/gold)
  WHEN sku LIKE 'OIL-%' OR name_en ILIKE '%oil%' OR name_en ILIKE '%soyabean%'
    THEN '/images/products/oil.svg'

  -- Spices (red/orange)
  WHEN name_en ILIKE '%masala%' OR name_en ILIKE '%spice%' OR name_en ILIKE '%tehari%'
    THEN '/images/products/spices.svg'

  -- Noodles/Pasta (yellow)
  WHEN name_en ILIKE '%noodle%' OR name_en ILIKE '%pasta%' OR name_en ILIKE '%ramen%'
    OR name_en ILIKE '%doodles%'
    THEN '/images/products/noodles.svg'

  -- Beverages/Drinks (blue)
  WHEN name_en ILIKE '%juice%' OR name_en ILIKE '%drink%' OR name_en ILIKE '%mango%'
    THEN '/images/products/beverages.svg'

  -- Ice Cream (pink)
  WHEN name_en ILIKE '%ice cream%' OR name_en ILIKE '%vanilla%' OR name_en ILIKE '%chocolate%'
    THEN '/images/products/icecream.svg'

  -- Tea/Coffee (brown)
  WHEN name_en ILIKE '%tea%' OR name_en ILIKE '%green tea%' OR name_en ILIKE '%coffee%'
    THEN '/images/products/tea.svg'

  -- Chocolate/Sweets (brown)
  WHEN name_en ILIKE '%chocolate%' OR name_en ILIKE '%cadbury%' OR name_en ILIKE '%dairy milk%'
    THEN '/images/products/chocolate.svg'

  -- Personal Care - Pepsodent/Toothpaste (blue)
  WHEN sku LIKE 'PC-PEP-%' OR name_en ILIKE '%pepsodent%' OR name_en ILIKE '%toothpaste%'
    THEN '/images/products/toothpaste.svg'

  -- Personal Care - Sunsilk/Shampoo (pink)
  WHEN sku LIKE 'PC-SUN-%' OR name_en ILIKE '%sunsilk%' OR name_en ILIKE '%shampoo%'
    THEN '/images/products/shampoo.svg'

  -- Personal Care - Clear/Shampoo (blue)
  WHEN sku LIKE 'PC-CLR-%' OR name_en ILIKE '%clear%'
    THEN '/images/products/clear-shampoo.svg'

  -- Personal Care - Dove (white/gold)
  WHEN sku LIKE 'PC-DOV-%' OR name_en ILIKE '%dove%'
    THEN '/images/products/dove.svg'

  -- Personal Care - Tresemme (black/purple)
  WHEN sku LIKE 'PC-TRS-%' OR name_en ILIKE '%tresemme%'
    THEN '/images/products/tresemme.svg'

  -- Personal Care - Ponds (pink)
  WHEN sku LIKE 'PC-PND-%' OR name_en ILIKE '%ponds%' OR name_en ILIKE '%pond%'
    THEN '/images/products/ponds.svg'

  -- Personal Care - Lifebuoy (red)
  WHEN sku LIKE 'PC-LFB-%' OR name_en ILIKE '%lifebuoy%' OR name_en ILIKE '%lifebouy%'
    THEN '/images/products/lifebuoy.svg'

  -- Personal Care - Lux (pink/purple)
  WHEN sku LIKE 'PC-LUX-%' OR name_en ILIKE '%lux%'
    THEN '/images/products/lux.svg'

  -- Personal Care - Close Up (red)
  WHEN sku LIKE 'PC-CLU-%' OR name_en ILIKE '%close up%'
    THEN '/images/products/closeup.svg'

  -- Personal Care - Fair & Lovely/Glow (pink)
  WHEN name_en ILIKE '%fair%lovely%' OR name_en ILIKE '%glow%'
    THEN '/images/products/fairlovely.svg'

  -- Personal Care - Men's products (dark blue)
  WHEN sku LIKE 'PC-GAL-%' OR name_en ILIKE '%garnier%' OR name_en ILIKE '%men%'
    THEN '/images/products/men-care.svg'

  -- Food - Knorr/Soup (green)
  WHEN sku LIKE 'PF-KNR-%' OR name_en ILIKE '%knorr%' OR name_en ILIKE '%soup%'
    THEN '/images/products/soup.svg'

  -- Beverages - Boost/Horlicks/Maltova (brown)
  WHEN sku LIKE 'BV-%' OR name_en ILIKE '%boost%' OR name_en ILIKE '%horlicks%'
    OR name_en ILIKE '%maltova%' OR name_en ILIKE '%nutrilife%'
    THEN '/images/products/health-drink.svg'

  -- Dal/Pulses (yellow)
  WHEN name_en ILIKE '%dal%' OR name_en ILIKE '%lentil%' OR name_en ILIKE '%motor%'
    THEN '/images/products/dal.svg'

  -- Instant noodles (red)
  WHEN name_en ILIKE '%samyang%' OR name_en ILIKE '%ramen%'
    THEN '/images/products/instant-noodles.svg'

  -- Default placeholder
  ELSE '/images/products/default.svg'
END
WHERE image_url IS NULL;

-- Verify the update
SELECT
  'Products with images' as check_item,
  COUNT(*)::text as count
FROM public.products
WHERE image_url IS NOT NULL
UNION ALL
SELECT
  'Products without images',
  COUNT(*)::text
FROM public.products
WHERE image_url IS NULL
UNION ALL
SELECT
  'Total products',
  COUNT(*)::text
FROM public.products;
