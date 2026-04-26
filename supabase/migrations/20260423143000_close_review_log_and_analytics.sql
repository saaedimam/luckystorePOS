-- =============================================================================
-- Persistent store close review logs + risk analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.close_review_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.pos_sessions(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL REFERENCES public.users(id),
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('manager', 'admin', 'owner')),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  queue_pending_count integer NOT NULL DEFAULT 0 CHECK (queue_pending_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  conflict_count integer NOT NULL DEFAULT 0 CHECK (conflict_count >= 0),
  last_sync_success_at timestamptz,
  close_status text NOT NULL CHECK (close_status IN ('green', 'yellow', 'red')),
  acknowledgement_confirmed boolean NOT NULL DEFAULT false,
  notes text,
  UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_close_review_log_store_reviewed_at
  ON public.close_review_log (store_id, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_close_review_log_status_reviewed_at
  ON public.close_review_log (close_status, reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_close_review_log_reviewer_reviewed_at
  ON public.close_review_log (reviewer_user_id, reviewed_at DESC);

ALTER TABLE public.close_review_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crl_select ON public.close_review_log;
CREATE POLICY crl_select
ON public.close_review_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users actor
    WHERE actor.auth_id = (SELECT auth.uid())
      AND (
        actor.role IN ('admin', 'owner')
        OR (actor.role = 'manager' AND actor.store_id = close_review_log.store_id)
      )
  )
);

DROP POLICY IF EXISTS crl_insert ON public.close_review_log;
CREATE POLICY crl_insert
ON public.close_review_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users actor
    WHERE actor.auth_id = (SELECT auth.uid())
      AND actor.id = close_review_log.reviewer_user_id
      AND actor.store_id = close_review_log.store_id
      AND actor.role IN ('manager', 'admin', 'owner')
  )
);

DROP POLICY IF EXISTS crl_update ON public.close_review_log;
CREATE POLICY crl_update
ON public.close_review_log
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users actor
    WHERE actor.auth_id = (SELECT auth.uid())
      AND actor.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users actor
    WHERE actor.auth_id = (SELECT auth.uid())
      AND actor.role IN ('admin', 'owner')
  )
);

CREATE OR REPLACE FUNCTION public.get_close_risk_analytics(
  p_store_id uuid DEFAULT NULL,
  p_manager_user_id uuid DEFAULT NULL,
  p_from date DEFAULT NULL,
  p_to date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_total_closes integer := 0;
  v_red_closes integer := 0;
  v_red_close_pct numeric(8,2) := 0;
  v_avg_queue_pending numeric(12,2) := 0;
  v_repeated_conflict_stores jsonb := '[]'::jsonb;
  v_risky_managers jsonb := '[]'::jsonb;
BEGIN
  WITH filtered AS (
    SELECT l.*
    FROM public.close_review_log l
    WHERE
      (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= COALESCE(
        p_from::timestamptz,
        date_trunc('month', now())
      )
      AND l.reviewed_at < COALESCE(
        (p_to + INTERVAL '1 day')::timestamptz,
        (date_trunc('month', now()) + INTERVAL '1 month')::timestamptz
      )
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE close_status = 'red'),
    COALESCE(AVG(queue_pending_count), 0)
  INTO v_total_closes, v_red_closes, v_avg_queue_pending
  FROM filtered;

  IF v_total_closes > 0 THEN
    v_red_close_pct := ROUND((v_red_closes::numeric / v_total_closes::numeric) * 100, 2);
  END IF;

  WITH filtered AS (
    SELECT l.*
    FROM public.close_review_log l
    WHERE
      (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= COALESCE(
        p_from::timestamptz,
        date_trunc('month', now())
      )
      AND l.reviewed_at < COALESCE(
        (p_to + INTERVAL '1 day')::timestamptz,
        (date_trunc('month', now()) + INTERVAL '1 month')::timestamptz
      )
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'store_id', s.store_id,
        'store_name', s.store_name,
        'conflict_close_count', s.conflict_close_count
      )
      ORDER BY s.conflict_close_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_repeated_conflict_stores
  FROM (
    SELECT
      f.store_id,
      COALESCE(st.name, 'Unknown Store') AS store_name,
      COUNT(*) FILTER (WHERE f.conflict_count > 0) AS conflict_close_count
    FROM filtered f
    LEFT JOIN public.stores st ON st.id = f.store_id
    GROUP BY f.store_id, st.name
    HAVING COUNT(*) FILTER (WHERE f.conflict_count > 0) >= 2
    ORDER BY conflict_close_count DESC
    LIMIT 10
  ) s;

  WITH filtered AS (
    SELECT l.*
    FROM public.close_review_log l
    WHERE
      (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= COALESCE(
        p_from::timestamptz,
        date_trunc('month', now())
      )
      AND l.reviewed_at < COALESCE(
        (p_to + INTERVAL '1 day')::timestamptz,
        (date_trunc('month', now()) + INTERVAL '1 month')::timestamptz
      )
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'reviewer_user_id', r.reviewer_user_id,
        'reviewer_name', r.reviewer_name,
        'risky_close_count', r.risky_close_count,
        'red_close_count', r.red_close_count
      )
      ORDER BY r.risky_close_count DESC, r.red_close_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_risky_managers
  FROM (
    SELECT
      f.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      COUNT(*) FILTER (WHERE f.close_status IN ('yellow', 'red')) AS risky_close_count,
      COUNT(*) FILTER (WHERE f.close_status = 'red') AS red_close_count
    FROM filtered f
    LEFT JOIN public.users u ON u.id = f.reviewer_user_id
    GROUP BY f.reviewer_user_id, u.full_name, u.name
    ORDER BY risky_close_count DESC, red_close_count DESC
    LIMIT 10
  ) r;

  RETURN jsonb_build_object(
    'red_closes_percent', v_red_close_pct,
    'average_pending_queue_at_close', ROUND(v_avg_queue_pending, 2),
    'repeated_conflict_stores', v_repeated_conflict_stores,
    'managers_with_most_risky_closes', v_risky_managers
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_close_risk_analytics(uuid, uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_close_risk_analytics(uuid, uuid, date, date) TO authenticated;
