-- =============================================================================
-- Shim: Add columns that later migrations reference but the baseline omits.
-- Must run AFTER baseline (20260301000000) and BEFORE any consumer.
-- All operations are idempotent.
-- =============================================================================

-- items: many RPCs reference "active" but baseline defines "is_active"
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
UPDATE public.items SET active = is_active WHERE active IS NULL;

-- items: lookup_item_by_scan and search_items_pos reference image_url
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS image_url text;

-- users: RPCs reference "full_name" but baseline defines "name"
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
UPDATE public.users SET full_name = name WHERE full_name IS NULL;

-- users: add last_login_at
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- categories: lookup_item_by_scan references "c.category" but baseline has "name"
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS category text;
UPDATE public.categories SET category = name WHERE category IS NULL;
