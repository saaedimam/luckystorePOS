# Store Seeding SQL

## Overview
SQL scripts to seed your Supabase database with default stores and user roles.

---

## Quick Setup: Default Stores

### Run in Supabase SQL Editor

```sql
-- =============== STORES ===============
-- Insert default stores for Lucky Store
-- These store codes (BR1, BR2, BR3) are used in CSV imports

INSERT INTO public.stores (code, name, address, timezone)
VALUES
  ('BR1', 'Lucky Store - Main Branch', 'Chattogram', 'Asia/Dhaka'),
  ('BR2', 'Lucky Store - City Center', 'Chattogram', 'Asia/Dhaka'),
  ('BR3', 'Lucky Store - Agrabad', 'Chattogram', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;

-- Verify stores created
SELECT code, name, address FROM stores ORDER BY code;
```

---

## Extended: 10 Stores

If you need more stores:

```sql
-- =============== EXTENDED STORES ===============
INSERT INTO public.stores (code, name, address, timezone)
VALUES
  ('BR1', 'Lucky Store - Main Branch', 'Chattogram', 'Asia/Dhaka'),
  ('BR2', 'Lucky Store - City Center', 'Chattogram', 'Asia/Dhaka'),
  ('BR3', 'Lucky Store - Agrabad', 'Chattogram', 'Asia/Dhaka'),
  ('BR4', 'Lucky Store - Halishahar', 'Chattogram', 'Asia/Dhaka'),
  ('BR5', 'Lucky Store - Nasirabad', 'Chattogram', 'Asia/Dhaka'),
  ('KT-A', 'Lucky Store - Kotwali A', 'Chattogram', 'Asia/Dhaka'),
  ('KT-B', 'Lucky Store - Kotwali B', 'Chattogram', 'Asia/Dhaka'),
  ('DHA-1', 'Lucky Store - Dhaka Branch 1', 'Dhaka', 'Asia/Dhaka'),
  ('DHA-2', 'Lucky Store - Dhaka Branch 2', 'Dhaka', 'Asia/Dhaka'),
  ('WAREHOUSE', 'Lucky Store - Central Warehouse', 'Chattogram', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;
```

---

## User Roles Setup

### Step 1: Create Users in Supabase Auth

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Create users:
   - Manager: `manager@luckystore.com`
   - Cashier: `cashier1@luckystore.com`
   - Admin: `admin@luckystore.com`

### Step 2: Get Auth UIDs

After creating users, copy their UIDs from the Users table.

### Step 3: Link to Users Table

```sql
-- =============== USER ROLES ===============
-- Replace 'REPLACE-WITH-AUTH-UID-X' with actual UIDs from Supabase Auth

-- Manager
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES
  ('REPLACE-WITH-AUTH-UID-1', 'manager@luckystore.com', 'Main Manager', 'manager')
ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;

-- Cashier 1
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES
  ('REPLACE-WITH-AUTH-UID-2', 'cashier1@luckystore.com', 'Cashier 1', 'cashier')
ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;

-- Cashier 2
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES
  ('REPLACE-WITH-AUTH-UID-3', 'cashier2@luckystore.com', 'Cashier 2', 'cashier')
ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;

-- Admin (if needed)
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES
  ('REPLACE-WITH-AUTH-UID-4', 'admin@luckystore.com', 'System Admin', 'admin')
ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;
```

---

## Complete Setup Script

### All-in-One Setup

```sql
-- ============================================
-- LUCKY STORE - COMPLETE DATABASE SETUP
-- ============================================

-- 1. STORES
INSERT INTO public.stores (code, name, address, timezone)
VALUES
  ('BR1', 'Lucky Store - Main Branch', 'Chattogram', 'Asia/Dhaka'),
  ('BR2', 'Lucky Store - City Center', 'Chattogram', 'Asia/Dhaka'),
  ('BR3', 'Lucky Store - Agrabad', 'Chattogram', 'Asia/Dhaka')
ON CONFLICT (code) DO NOTHING;

-- 2. CATEGORIES (Common categories)
INSERT INTO public.categories (name)
VALUES
  ('Grocery'),
  ('Cosmetics'),
  ('Snacks'),
  ('Personal Care'),
  ('Beverages'),
  ('Frozen'),
  ('Eggs'),
  ('Ice Cream'),
  ('Baking Needs')
ON CONFLICT (name) DO NOTHING;

-- 3. VERIFY SETUP
SELECT 'Stores' as type, COUNT(*) as count FROM stores
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories;

-- 4. USERS (Run after creating in Auth)
-- Uncomment and replace UIDs after creating users in Supabase Auth
/*
INSERT INTO public.users (auth_id, email, full_name, role)
VALUES
  ('YOUR-AUTH-UID-HERE', 'manager@luckystore.com', 'Main Manager', 'manager'),
  ('YOUR-AUTH-UID-HERE', 'cashier1@luckystore.com', 'Cashier 1', 'cashier')
ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;
*/
```

---

## Verification Queries

### Check Stores
```sql
SELECT code, name, address, created_at 
FROM stores 
ORDER BY code;
```

### Check Categories
```sql
SELECT name, created_at 
FROM categories 
ORDER BY name;
```

### Check Users
```sql
SELECT email, full_name, role, created_at 
FROM users 
ORDER BY role, email;
```

### Check Store Stock Summary
```sql
SELECT 
  s.code as store_code,
  s.name as store_name,
  COUNT(DISTINCT sl.item_id) as items_with_stock,
  SUM(sl.qty) as total_stock
FROM stores s
LEFT JOIN stock_levels sl ON sl.store_id = s.id
GROUP BY s.id, s.code, s.name
ORDER BY s.code;
```

---

## Troubleshooting

### Error: "Store code 'BR1' not found"
**Solution:** Run the store seeding SQL above

### Error: "duplicate key value violates unique constraint"
**Solution:** Stores already exist - this is OK, use `ON CONFLICT DO NOTHING`

### Users not linking
**Solution:** 
1. Verify user exists in Supabase Auth
2. Copy correct UID
3. Update SQL with correct UID
4. Re-run insert

---

## Next Steps

1. ✅ Run store seeding SQL
2. ✅ Verify stores created
3. ✅ Create users in Auth
4. ✅ Link users to users table
5. ✅ Test CSV import with store codes

---

## Store Code Reference

Keep this reference for CSV imports:

```
BR1 - Lucky Store - Main Branch
BR2 - Lucky Store - City Center
BR3 - Lucky Store - Agrabad
```

Use these codes in your CSV `store_code` column.

