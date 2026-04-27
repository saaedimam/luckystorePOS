-- inventory_summary.sql
-- Materialized views for inventory analytics.
-- Caches complex computations like aging buckets and running balances.
-- These views are refreshed periodically to avoid real-time performance overhead.

-- View: Running inventory balance per item
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mat_inventory_running_balance AS
SELECT DISTINCT ON (sl.store_id, sl.item_id)
  sl.store_id,
  sl.item_id,
  sl.qty AS current_qty,
  sl.updated_at
FROM public.stock_levels sl
ORDER BY sl.store_id, sl.item_id, sl.updated_at DESC;

-- View: Stock aging buckets (0-30, 31-60, 61-90, 90+ days)
-- This view groups stock movements by item and categorizes them by age
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mat_stock_aging_buckets AS
SELECT 
  i.id AS item_id,
  i.name AS item_name,
  sl.store_id,
  SUM(CASE 
    WHEN sm.created_at >= NOW() - INTERVAL '30 days' THEN sm.delta
    WHEN sm.created_at >= NOW() - INTERVAL '60 days' THEN sm.delta
    WHEN sm.created_at >= NOW() - INTERVAL '90 days' THEN sm.delta
    ELSE sm.delta
  END) as recent_movement,
  COUNT(CASE WHEN sm.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as movements_7d,
  COUNT(CASE WHEN sm.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as movements_30d,
  COUNT(CASE WHEN sm.created_at >= NOW() - INTERVAL '60 days' THEN 1 END) as movements_60d
FROM public.items i
LEFT JOIN public.stock_levels sl ON sl.item_id = i.id
LEFT JOIN public.stock_movements sm ON sm.item_id = i.id
GROUP BY i.id, sl.store_id;

-- View: Low stock alert summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mat_low_stock_alerts AS
SELECT 
  s.code AS store_code,
  s.name AS store_name,
  i.id AS item_id,
  i.name AS item_name,
  i.sku,
  COALESCE(sl.qty, 0) AS current_qty,
  COALESCE(sat.min_qty, 5) AS min_threshold,
  CASE 
    WHEN COALESCE(sl.qty, 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(sl.qty, 0) <= COALESCE(sat.min_qty, 5) THEN 'low_stock'
    ELSE 'ok'
  END AS alert_status
FROM public.items i
LEFT JOIN public.stock_levels sl ON sl.item_id = i.id
LEFT JOIN public.stock_alert_thresholds sat ON sat.item_id = i.id
LEFT JOIN public.stores s ON s.id = sl.store_id;

-- Refresh these materialized views
CREATE OR REPLACE FUNCTION refresh_inventory_summary() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mat_inventory_running_balance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mat_stock_aging_buckets;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mat_low_stock_alerts;
END;
$$ LANGUAGE plpgsql;

-- Grant usage
GRANT SELECT ON public.mat_inventory_running_balance TO authenticated;
GRANT SELECT ON public.mat_stock_aging_buckets TO authenticated;
GRANT SELECT ON public.mat_low_stock_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_inventory_summary() TO service_role;
