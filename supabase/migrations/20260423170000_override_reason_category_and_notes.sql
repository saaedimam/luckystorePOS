-- =============================================================================
-- Structured override reason category + optional override notes
-- =============================================================================

ALTER TABLE public.close_review_log
  ADD COLUMN IF NOT EXISTS override_reason_category text,
  ADD COLUMN IF NOT EXISTS override_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'close_review_log_override_reason_category_check'
  ) THEN
    ALTER TABLE public.close_review_log
      ADD CONSTRAINT close_review_log_override_reason_category_check
      CHECK (
        override_reason_category IS NULL OR
        override_reason_category IN (
          'internet outage',
          'queue corruption',
          'emergency close',
          'manager absence',
          'system incident',
          'other'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'close_review_log_admin_override_requires_category_check'
  ) THEN
    ALTER TABLE public.close_review_log
      ADD CONSTRAINT close_review_log_admin_override_requires_category_check
      CHECK (
        admin_override = false
        OR (
          override_reason_category IS NOT NULL
          AND btrim(override_reason_category) <> ''
        )
      );
  END IF;
END $$;

-- Backfill existing text reason into category when possible.
UPDATE public.close_review_log
SET override_reason_category = CASE
  WHEN override_reason_category IS NOT NULL THEN override_reason_category
  WHEN lower(coalesce(override_reason, '')) IN (
    'internet outage',
    'queue corruption',
    'emergency close',
    'manager absence',
    'system incident',
    'other'
  ) THEN lower(override_reason)
  ELSE NULL
END
WHERE admin_override = true;
