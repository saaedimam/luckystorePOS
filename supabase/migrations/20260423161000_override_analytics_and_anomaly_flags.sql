-- =============================================================================
-- Override analytics and anomaly flags
-- =============================================================================

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
  v_override_total integer := 0;
  v_weak_reason_count integer := 0;
  v_overrides_by_user jsonb := '[]'::jsonb;
  v_overrides_by_store jsonb := '[]'::jsonb;
  v_overrides_by_reason_category jsonb := '[]'::jsonb;
  v_override_frequency_trend jsonb := '[]'::jsonb;
  v_repeat_offenders jsonb := jsonb_build_object('users', '[]'::jsonb, 'stores', '[]'::jsonb);
  v_anomalies jsonb := jsonb_build_object(
    'admins_over_monthly_threshold', '[]'::jsonb,
    'stores_over_monthly_threshold', '[]'::jsonb,
    'blank_or_weak_reasons', '[]'::jsonb
  );
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
      AND l.admin_override = true
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (
      WHERE
        l.override_reason IS NULL
        OR btrim(l.override_reason) = ''
        OR char_length(btrim(l.override_reason)) < 12
        OR lower(btrim(l.override_reason)) IN ('override', 'ok', 'na', 'n/a', 'urgent', 'approved', 'needed')
    )
  INTO v_override_total, v_weak_reason_count
  FROM filtered l;

  WITH filtered_overrides AS (
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
      AND l.admin_override = true
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'reviewer_user_id', x.reviewer_user_id,
        'reviewer_name', x.reviewer_name,
        'override_count', x.override_count
      )
      ORDER BY x.override_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_overrides_by_user
  FROM (
    SELECT
      o.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.users u ON u.id = o.reviewer_user_id
    GROUP BY o.reviewer_user_id, u.full_name, u.name
    ORDER BY override_count DESC
    LIMIT 20
  ) x;

  WITH filtered_overrides AS (
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
      AND l.admin_override = true
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
  INTO v_overrides_by_store
  FROM (
    SELECT
      o.store_id,
      COALESCE(st.name, 'Unknown Store') AS store_name,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.stores st ON st.id = o.store_id
    GROUP BY o.store_id, st.name
    ORDER BY override_count DESC
    LIMIT 20
  ) x;

  WITH filtered_overrides AS (
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
      AND l.admin_override = true
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
  INTO v_overrides_by_reason_category
  FROM (
    SELECT
      CASE
        WHEN o.override_reason IS NULL OR btrim(o.override_reason) = '' THEN 'blank'
        WHEN char_length(btrim(o.override_reason)) < 12 THEN 'weak'
        WHEN lower(o.override_reason) LIKE '%sync%' OR lower(o.override_reason) LIKE '%network%' OR lower(o.override_reason) LIKE '%offline%' THEN 'sync_or_connectivity'
        WHEN lower(o.override_reason) LIKE '%conflict%' OR lower(o.override_reason) LIKE '%stock%' OR lower(o.override_reason) LIKE '%inventory%' THEN 'inventory_or_conflict'
        WHEN lower(o.override_reason) LIKE '%cash%' OR lower(o.override_reason) LIKE '%drawer%' OR lower(o.override_reason) LIKE '%difference%' THEN 'cash_reconciliation'
        WHEN lower(o.override_reason) LIKE '%system%' OR lower(o.override_reason) LIKE '%bug%' OR lower(o.override_reason) LIKE '%error%' THEN 'system_issue'
        ELSE 'other'
      END AS reason_category,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    GROUP BY reason_category
    ORDER BY override_count DESC
  ) x;

  WITH filtered_overrides AS (
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
      AND l.admin_override = true
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'period', x.period,
        'override_count', x.override_count
      )
      ORDER BY x.period
    ),
    '[]'::jsonb
  )
  INTO v_override_frequency_trend
  FROM (
    SELECT
      to_char(date_trunc('day', o.reviewed_at), 'YYYY-MM-DD') AS period,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    GROUP BY date_trunc('day', o.reviewed_at)
    ORDER BY period
  ) x;

  WITH filtered_overrides AS (
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
      AND l.admin_override = true
  ),
  offenders_by_user AS (
    SELECT
      o.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.users u ON u.id = o.reviewer_user_id
    GROUP BY o.reviewer_user_id, u.full_name, u.name
    HAVING COUNT(*) >= 3
    ORDER BY override_count DESC
  ),
  offenders_by_store AS (
    SELECT
      o.store_id,
      COALESCE(st.name, 'Unknown Store') AS store_name,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.stores st ON st.id = o.store_id
    GROUP BY o.store_id, st.name
    HAVING COUNT(*) >= 3
    ORDER BY override_count DESC
  )
  SELECT jsonb_build_object(
    'users',
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'reviewer_user_id', a.reviewer_user_id,
        'reviewer_name', a.reviewer_name,
        'override_count', a.override_count
      )) FROM offenders_by_user a),
      '[]'::jsonb
    ),
    'stores',
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'store_id', s.store_id,
        'store_name', s.store_name,
        'override_count', s.override_count
      )) FROM offenders_by_store s),
      '[]'::jsonb
    )
  )
  INTO v_repeat_offenders;

  WITH filtered_overrides AS (
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
      AND l.admin_override = true
  ),
  admin_monthly AS (
    SELECT
      o.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      to_char(date_trunc('month', o.reviewed_at), 'YYYY-MM') AS month,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.users u ON u.id = o.reviewer_user_id
    GROUP BY o.reviewer_user_id, u.full_name, u.name, date_trunc('month', o.reviewed_at)
    HAVING COUNT(*) > 5
  ),
  store_monthly AS (
    SELECT
      o.store_id,
      COALESCE(st.name, 'Unknown Store') AS store_name,
      to_char(date_trunc('month', o.reviewed_at), 'YYYY-MM') AS month,
      COUNT(*) AS override_count
    FROM filtered_overrides o
    LEFT JOIN public.stores st ON st.id = o.store_id
    GROUP BY o.store_id, st.name, date_trunc('month', o.reviewed_at)
    HAVING COUNT(*) > 3
  ),
  weak_reason_rows AS (
    SELECT
      o.id,
      o.reviewer_user_id,
      COALESCE(u.full_name, u.name, 'Unknown User') AS reviewer_name,
      o.store_id,
      COALESCE(st.name, 'Unknown Store') AS store_name,
      o.override_reason,
      o.reviewed_at
    FROM filtered_overrides o
    LEFT JOIN public.users u ON u.id = o.reviewer_user_id
    LEFT JOIN public.stores st ON st.id = o.store_id
    WHERE
      o.override_reason IS NULL
      OR btrim(o.override_reason) = ''
      OR char_length(btrim(o.override_reason)) < 12
      OR lower(btrim(o.override_reason)) IN ('override', 'ok', 'na', 'n/a', 'urgent', 'approved', 'needed')
  )
  SELECT jsonb_build_object(
    'admins_over_monthly_threshold',
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'reviewer_user_id', a.reviewer_user_id,
        'reviewer_name', a.reviewer_name,
        'month', a.month,
        'override_count', a.override_count,
        'threshold', 5
      )) FROM admin_monthly a),
      '[]'::jsonb
    ),
    'stores_over_monthly_threshold',
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'store_id', s.store_id,
        'store_name', s.store_name,
        'month', s.month,
        'override_count', s.override_count,
        'threshold', 3
      )) FROM store_monthly s),
      '[]'::jsonb
    ),
    'blank_or_weak_reasons',
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'close_review_id', w.id,
        'reviewer_user_id', w.reviewer_user_id,
        'reviewer_name', w.reviewer_name,
        'store_id', w.store_id,
        'store_name', w.store_name,
        'override_reason', w.override_reason,
        'reviewed_at', w.reviewed_at
      )) FROM weak_reason_rows w),
      '[]'::jsonb
    )
  )
  INTO v_anomalies;

  RETURN jsonb_build_object(
    'red_closes_percent', v_red_close_pct,
    'average_pending_queue_at_close', ROUND(v_avg_queue_pending, 2),
    'repeated_conflict_stores', v_repeated_conflict_stores,
    'managers_with_most_risky_closes', v_risky_managers,
    'override_total', v_override_total,
    'weak_reason_count', v_weak_reason_count,
    'overrides_by_user', v_overrides_by_user,
    'overrides_by_store', v_overrides_by_store,
    'overrides_by_reason_category', v_overrides_by_reason_category,
    'override_frequency_trend', v_override_frequency_trend,
    'repeat_offenders', v_repeat_offenders,
    'anomalies', v_anomalies
  );
END;
$$;
