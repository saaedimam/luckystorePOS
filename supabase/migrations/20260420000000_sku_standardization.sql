-- =============================================================================
-- Phase 0: SKU Standardization
-- =============================================================================
-- Adds three new columns to items:
--   short_code : preserves original human-readable code (e.g. 'DDP-DAN-001')
--   barcode    : unique scannable Code-128 value printed on the M102 label
--               format: 'LS-XXXXXX'  (e.g. 'LS-000001' … 'LS-000539')
--   brand      : brand name from the CSV 'brand' column
--   group_tag  : item_group_id from CSV — groups size siblings for display
--
-- Run order: BEFORE any Phase 1+ migrations and BEFORE reimporting inventory.
-- Idempotent: safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Extend the items table
-- ---------------------------------------------------------------------------
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS short_code text,   -- original SKU e.g. 'DDP-DAN-001'
  ADD COLUMN IF NOT EXISTS barcode    text,   -- scannable  e.g. 'LS-000001'
  ADD COLUMN IF NOT EXISTS brand      text,   -- brand name e.g. 'Unilever'
  ADD COLUMN IF NOT EXISTS group_tag  text;   -- size-group e.g. 'Dano Daily Pusti-Dano-01'

-- ---------------------------------------------------------------------------
-- 2) Back-fill short_code from existing sku (preserve legacy codes)
-- ---------------------------------------------------------------------------
UPDATE public.items
  SET short_code = sku
  WHERE short_code IS NULL;

-- ---------------------------------------------------------------------------
-- 3) Generate LS-XXXXXX barcodes for items that don't have one yet
--    Ordered by created_at so the sequence is stable across re-runs.
-- ---------------------------------------------------------------------------
WITH ranked AS (
  SELECT
    id,
    'LS-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at, id)::text, 6, '0') AS new_barcode
  FROM public.items
  WHERE barcode IS NULL
)
UPDATE public.items i
  SET barcode = r.new_barcode
  FROM ranked r
  WHERE i.id = r.id;

-- ---------------------------------------------------------------------------
-- 4) Indexes
-- ---------------------------------------------------------------------------

-- Unique barcode — enforced at DB level so no two products share a barcode
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_barcode_unique
  ON public.items (barcode)
  WHERE barcode IS NOT NULL;

-- Fast lookup by original short_code (for staff searching by old codes)
CREATE INDEX IF NOT EXISTS idx_items_short_code
  ON public.items (short_code)
  WHERE short_code IS NOT NULL;

-- Fast lookup by SKU (existing column — add index if missing)
CREATE INDEX IF NOT EXISTS idx_items_sku
  ON public.items (sku);

-- Group tag index (for fetching size-siblings in POS grid)
CREATE INDEX IF NOT EXISTS idx_items_group_tag
  ON public.items (group_tag)
  WHERE group_tag IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5) RLS: new columns follow existing item policies (no new policies needed)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Verification query (run manually after migration):
--   SELECT sku, short_code, barcode, brand, group_tag
--   FROM public.items ORDER BY barcode LIMIT 20;
-- ---------------------------------------------------------------------------
