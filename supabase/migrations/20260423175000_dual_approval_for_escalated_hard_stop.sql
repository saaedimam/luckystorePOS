-- =============================================================================
-- Dual approval fields for escalated hard-stop closes
-- =============================================================================

ALTER TABLE public.close_review_log
  ADD COLUMN IF NOT EXISTS dual_approval_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS secondary_approver_user_id uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS secondary_approver_role text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'close_review_log_secondary_approver_role_check'
  ) THEN
    ALTER TABLE public.close_review_log
      ADD CONSTRAINT close_review_log_secondary_approver_role_check
      CHECK (
        secondary_approver_role IS NULL OR
        secondary_approver_role IN ('admin', 'owner')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'close_review_log_dual_approval_requires_secondary_check'
  ) THEN
    ALTER TABLE public.close_review_log
      ADD CONSTRAINT close_review_log_dual_approval_requires_secondary_check
      CHECK (
        dual_approval_required = false OR
        (
          secondary_approver_user_id IS NOT NULL AND
          secondary_approver_role IS NOT NULL
        )
      );
  END IF;
END $$;
