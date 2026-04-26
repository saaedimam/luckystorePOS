-- =============================================================================
-- Close review hard-stop override audit fields
-- =============================================================================

ALTER TABLE public.close_review_log
  ADD COLUMN IF NOT EXISTS admin_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_reason text;
