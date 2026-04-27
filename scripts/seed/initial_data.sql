-- initial_data.sql
-- Basic seed data for Lucky Store Supabase instance.
-- This script is used by the Dockerfile in `docker/seed-db` to populate
-- essential lookup tables such as stores, categories, items, and a demo user.

-- Stores
INSERT INTO public.stores (id, name, code) VALUES
  (gen_random_uuid(), 'Main Street Store', 'MS001'),
  (gen_random_uuid(), 'Downtown Outlet', 'DT002');

-- Categories
INSERT INTO public.categories (id, name) VALUES
  (gen_random_uuid(), 'Beverages'),
  (gen_random_uuid(), 'Snacks'),
  (gen_random_uuid(), 'Electronics');

-- Items (example products)
INSERT INTO public.items (id, name, sku, category_id, price, active) VALUES
  (gen_random_uuid(), 'Cola', 'COLA001', (SELECT id FROM public.categories WHERE name = 'Beverages'), 1.50, true),
  (gen_random_uuid(), 'Chips', 'CHIPS001', (SELECT id FROM public.categories WHERE name = 'Snacks'), 0.99, true),
  (gen_random_uuid(), 'USB Cable', 'USB001', (SELECT id FROM public.categories WHERE name = 'Electronics'), 4.99, true);

-- Stock levels (initial quantity for each store/item)
INSERT INTO public.stock_levels (store_id, item_id, qty) SELECT s.id, i.id, 100
FROM public.stores s CROSS JOIN public.items i;

-- Demo user (admin role)
INSERT INTO public.users (id, auth_id, email, role, store_id) VALUES
  (gen_random_uuid(), 'demo-auth-id', 'admin@example.com', 'admin', (SELECT id FROM public.stores LIMIT 1));
