# Store Setup Guide

## Overview
Before using the extended importer, you must set up stores in your database. This guide shows how to create and manage stores.

---

## Step 1: Create Default Store

### Option A: SQL Editor (Recommended)

Run in Supabase SQL Editor:

```sql
-- Create default store
INSERT INTO stores (code, name, address, timezone)
VALUES ('BR1', 'Main Branch', 'Your Store Address', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;
```

### Option B: Multiple Stores

```sql
-- Create multiple stores
INSERT INTO stores (code, name, address, timezone) VALUES
  ('BR1', 'Main Branch', '123 Main Street, Dhaka', 'Asia/Dhaka'),
  ('BR2', 'Branch 2', '456 Second Street, Dhaka', 'Asia/Dhaka'),
  ('KT-A', 'Kotwali Branch A', '789 Kotwali Road, Dhaka', 'Asia/Dhaka'),
  ('KT-B', 'Kotwali Branch B', '321 Kotwali Road, Dhaka', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;
```

### Option C: Via Supabase Dashboard

1. Go to Table Editor → `stores`
2. Click "Insert row"
3. Fill in:
   - `code`: Unique code (e.g., BR1)
   - `name`: Store name
   - `address`: Store address (optional)
   - `timezone`: Default 'Asia/Dhaka'
4. Save

---

## Step 2: Verify Stores

Check stores exist:

```sql
SELECT code, name, address FROM stores;
```

Expected output:
```
code  | name         | address
------|--------------|------------------
BR1   | Main Branch | 123 Main Street
```

---

## Step 3: Store Code Naming Convention

### Recommended Format
- **Short codes**: BR1, BR2, BR3
- **Location codes**: KT-A, KT-B, DHA-1
- **Descriptive**: MAIN, WAREHOUSE, ONLINE

### Rules
- Must be unique
- No spaces (use hyphens)
- Keep it short (max 10 characters recommended)
- Use uppercase for consistency

---

## Step 4: Update Existing Data

If you already have items but no stores:

```sql
-- 1. Create default store
INSERT INTO stores (code, name) VALUES ('BR1', 'Main Branch')
ON CONFLICT (code) DO NOTHING;

-- 2. Get store ID
SELECT id FROM stores WHERE code = 'BR1';

-- 3. Create stock levels for existing items (optional)
-- Replace <store_id> with actual ID from step 2
INSERT INTO stock_levels (store_id, item_id, qty)
SELECT 
  '<store_id>'::uuid,
  id,
  0  -- Default stock to 0
FROM items
ON CONFLICT (store_id, item_id) DO NOTHING;
```

---

## Step 5: Store Management

### Add New Store

```sql
INSERT INTO stores (code, name, address, timezone)
VALUES ('NEW-STORE', 'New Store Name', 'Address', 'Asia/Dhaka');
```

### Update Store

```sql
UPDATE stores
SET name = 'Updated Name', address = 'New Address'
WHERE code = 'BR1';
```

### Delete Store (Careful!)

```sql
-- This will cascade delete stock_levels
DELETE FROM stores WHERE code = 'OLD-STORE';
```

---

## Step 6: Use in CSV Import

In your CSV file, use the `store_code` column:

```csv
name,stock_qty,store_code
Parachute Oil,50,BR1
Egg Loose,200,BR1
```

The importer will:
1. Look up store by `code`
2. Create/update stock levels for that store
3. Log stock movements with store reference

---

## Troubleshooting

### Error: "Store code 'BR1' not found"
**Solution:** Create the store first using SQL above

### Error: "stock_qty provided but store_code missing"
**Solution:** Add `store_code` column to CSV when importing stock

### Multiple Stores Not Showing
**Solution:** Verify stores exist: `SELECT * FROM stores;`

---

## Best Practices

1. **Create stores before importing stock**
2. **Use consistent naming convention**
3. **Keep store codes short and memorable**
4. **Document store codes in your system**
5. **Don't delete stores with existing stock** (archive instead)

---

## Store Codes Reference

Create a reference document:

```
BR1 - Main Branch (Primary location)
BR2 - Branch 2 (Secondary location)
KT-A - Kotwali Branch A
KT-B - Kotwali Branch B
WAREHOUSE - Central Warehouse
ONLINE - Online orders fulfillment
```

---

## Next Steps

1. ✅ Create at least one store
2. ✅ Verify store exists
3. ✅ Use store code in CSV imports
4. ✅ Test import with stock quantities

