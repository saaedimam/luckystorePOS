-- =============================================================================
-- Monthly governance scorecard
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_monthly_governance_scorecard(
  p_store_id uuid DEFAULT NULL,
  p_manager_user_id uuid DEFAULT NULL,
  p_month date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
  v_month_start date := date_trunc('month', COALESCE(p_month, CURRENT_DATE))::date;
  v_next_month_start date := (date_trunc('month', COALESCE(p_month, CURRENT_DATE)) + INTERVAL '1 month')::date;
  v_prev_month_start date := (date_trunc('month', COALESCE(p_month, CURRENT_DATE)) - INTERVAL '1 month')::date;
  v_curr_red_pct numeric(8,2) := 0;
  v_prev_red_pct numeric(8,2) := 0;
  v_risk_trend_improvement numeric(8,2) := 0;
  v_stores_with_most_overrides jsonb := '[]'::jsonb;
  v_managers_needing_coaching jsonb := '[]'::jsonb;
  v_admins_overriding_too_often jsonb := '[]'::jsonb;
  v_reasons_breakdown jsonb := '[]'::jsonb;
BEGIN
  WITH filtered AS (
    SELECT *
    FROM public.close_review_log l
    WHERE
      (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= v_month_start::timestamptz
      AND l.reviewed_at < v_next_month_start::timestamptz
  )
  SELECT COALESCE(
    ROUND(
      (
        COUNT(*) FILTER (WHERE close_status = 'red')::numeric /
        NULLIF(COUNT(*)::numeric, 0)
      ) * 100,
      2
    ),
    0
  )
  INTO v_curr_red_pct
  FROM filtered;

  WITH filtered AS (
    SELECT *
    FROM public.close_review_log l
    WHERE
      (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= v_prev_month_start::timestamptz
      AND l.reviewed_at < v_month_start::timestamptz
  )
  SELECT COALESCE(
    ROUND(
      (
        COUNT(*) FILTER (WHERE close_status = 'red')::numeric /
        NULLIF(COUNT(*)::numeric, 0)
      ) * 100,
      2
    ),
    0
  )
  INTO v_prev_red_pct
  FROM filtered;

  v_risk_trend_improvement := ROUND(v_prev_red_pct - v_curr_red_pct, 2);

  WITH filtered_overrides AS (
    SELECT *
    FROM public.close_review_log l
    WHERE
      l.admin_override = true
      AND (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= v_month_start::timestamptz
      AND l.reviewed_at < v_next_month_start::timestamptz
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'store_id', x.store_id,
        'store_name', x.store_name,
        'override_count', x.override_count
      )
      ORDER BY x.override_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_stores_with_most_overrides
  FROM (
    SELECT
      o.store_id,
      COALESCE(s.name, 'Unknown Store') AS store_name,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.stores s ON s.id = o.store_id
    GROUP BY o.store_id, s.name
    ORDER BY override_count DESC
    LIMIT 10
  ) x;

  WITH filtered AS (
    SELECT *
    FROM public.close_review_log l
    WHERE
      (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= v_month_start::timestamptz
      AND l.reviewed_at < v_next_month_start::timestamptz
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'reviewer_user_id', x.reviewer_user_id,
        'reviewer_name', x.reviewer_name,
        'risky_close_count', x.risky_close_count,
        'override_count', x.override_count
      )
      ORDER BY x.risky_close_count DESC, x.override_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_managers_needing_coaching
  FROM (
    SELECT
      f.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      COUNT(*) FILTER (WHERE f.close_status IN ('yellow', 'red')) AS risky_close_count,
      COUNT(*) FILTER (WHERE f.admin_override = true) AS override_count
    FROM filtered f
    LEFT JOIN public.users u ON u.id = f.reviewer_user_id
    GROUP BY f.reviewer_user_id, u.full_name, u.name
    HAVING COUNT(*) FILTER (WHERE f.close_status IN ('yellow', 'red')) >= 3
    ORDER BY risky_close_count DESC, override_count DESC
    LIMIT 10
  ) x;

  WITH filtered_overrides AS (
    SELECT *
    FROM public.close_review_log l
    WHERE
      l.admin_override = true
      AND (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= v_month_start::timestamptz
      AND l.reviewed_at < v_next_month_start::timestamptz
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'reviewer_user_id', x.reviewer_user_id,
        'reviewer_name', x.reviewer_name,
        'override_count', x.override_count,
        'threshold', 5
      )
      ORDER BY x.override_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_admins_overriding_too_often
  FROM (
    SELECT
      o.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.users u ON u.id = o.reviewer_user_id
    WHERE o.reviewer_role = 'admin'
    GROUP BY o.reviewer_user_id, u.full_name, u.name
    HAVING COUNT(*) > 5
    ORDER BY override_count DESC
  ) x;

  WITH filtered_overrides AS (
    SELECT *
    FROM public.close_review_log l
    WHERE
      l.admin_override = true
      AND (p_store_id IS NULL OR l.store_id = p_store_id)
      AND (p_manager_user_id IS NULL OR l.reviewer_user_id = p_manager_user_id)
      AND l.reviewed_at >= v_month_start::timestamptz
      AND l.reviewed_at < v_next_month_start::timestamptz
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'reason_category', x.reason_category,
        'override_count', x.override_count
      )
      ORDER BY x.override_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_reasons_breakdown
  FROM (
    SELECT
      COALESCE(
        NULLIF(btrim(o.override_reason_category), ''),
        NULLIF(btrim(o.override_reason), ''),
        'unspecified'
      ) AS reason_category,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    GROUP BY 1
    ORDER BY override_count DESC
  ) x;

  RETURN jsonb_build_object(
    'month', to_char(v_month_start, 'YYYY-MM'),
    'stores_with_most_overrides', v_stores_with_most_overrides,
    'managers_needing_coaching', v_managers_needing_coaching,
    'admins_overriding_too_often', v_admins_overriding_too_often,
    'reasons_breakdown', v_reasons_breakdown,
    'risk_trend_improvement', jsonb_build_object(
      'current_red_close_percent', v_curr_red_pct,
      'previous_red_close_percent', v_prev_red_pct,
      'improvement_percent_points', v_risk_trend_improvement
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_monthly_governance_scorecard(uuid, uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_monthly_governance_scorecard(uuid, uuid, date) TO authenticated;
