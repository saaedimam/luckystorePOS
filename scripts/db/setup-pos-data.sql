-- Setup script for POS system
-- Run this in Supabase SQL Editor after applying migrations

-- 1. Create a test store if none exists
INSERT INTO stores (code, name, address, timezone)
VALUES ('MAIN', 'Lucky Store - Main Branch', 'Dhaka, Bangladesh', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;

-- 2. Add store_id to existing users (set to main store)
UPDATE users 
SET store_id = (SELECT id FROM stores WHERE code = 'MAIN')
WHERE store_id IS NULL;

-- 3. Initialize stock levels for all items at main store
-- This creates stock_levels entries with 0 qty for all active items
INSERT INTO stock_levels (store_id, item_id, qty)
SELECT 
  (SELECT id FROM stores WHERE code = 'MAIN') as store_id,
  items.id as item_id,
  0 as qty
FROM items
WHERE active = true
ON CONFLICT (store_id, item_id) DO NOTHING;

-- 4. Add some sample stock (modify quantities as needed)
-- This updates the qty for items that need initial stock
UPDATE stock_levels
SET qty = 100  -- Set initial stock to 100 for all items
WHERE store_id = (SELECT id FROM stores WHERE code = 'MAIN')
  AND qty = 0;

-- 5. Verify setup
SELECT 
  'Stores' as entity,
  COUNT(*) as count
FROM stores

UNION ALL

SELECT 
  'Users with store_id' as entity,
  COUNT(*) as count
FROM users
WHERE store_id IS NOT NULL

UNION ALL

SELECT 
  'Stock levels initialized' as entity,
  COUNT(*) as count
FROM stock_levels

UNION ALL

SELECT 
  'Items with stock' as entity,
  COUNT(*) as count
FROM stock_levels
WHERE qty > 0;

-- 6. View sample data
SELECT 
  s.name as store,
  i.name as item,
  i.barcode,
  i.price,
  sl.qty as stock
FROM stock_levels sl
JOIN stores s ON sl.store_id = s.id
JOIN items i ON sl.item_id = i.id
ORDER BY i.name
LIMIT 20;

