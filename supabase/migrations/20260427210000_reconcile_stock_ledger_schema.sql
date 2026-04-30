-- =============================================================================
-- Schema Reconciliation Migration: stock_ledger
-- Date: 2026-04-27
-- Purpose:
--   Validates and reconciles the stock_ledger table schema against the expected
--   definition. CREATE TABLE IF NOT EXISTS silently no-ops if the table already
--   exists with wrong columns. This migration explicitly adds missing columns.
-- =============================================================================

-- Add any missing columns using IF NOT EXISTS guards.
-- Safe to re-run — no data destruction possible.

ALTER TABLE public.stock_ledger
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS store_id uuid,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS previous_quantity numeric(15,4),
  ADD COLUMN IF NOT EXISTS new_quantity numeric(15,4),
  ADD COLUMN IF NOT EXISTS quantity_change numeric(15,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_type text,
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS movement_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS performed_by uuid,
  ADD COLUMN IF NOT EXISTS reference_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Ensure movement_id uniqueness for deduplication (idempotent index creation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_ledger_movement_id
  ON public.stock_ledger (movement_id);

-- Ensure basic query performance indexes
CREATE INDEX IF NOT EXISTS idx_stock_ledger_store_product
  ON public.stock_ledger (store_id, product_id);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at
  ON public.stock_ledger (created_at DESC);

-- Verify final schema (helpful for post-migration audit log)
DO $$
DECLARE
  missing_cols text := '';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ledger' AND column_name = 'quantity_change') THEN
    missing_cols := missing_cols || 'quantity_change, ';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_ledger' AND column_name = 'movement_id') THEN
    missing_cols := missing_cols || 'movement_id, ';
  END IF;
  IF missing_cols != '' THEN
    RAISE WARNING 'stock_ledger still missing columns after reconciliation: %', missing_cols;
  ELSE
    RAISE NOTICE 'stock_ledger schema reconciliation: OK';
  END IF;
END $$;
