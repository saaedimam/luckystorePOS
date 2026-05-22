-- =============================================================================
-- Migration: Reserve Online Stock Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION reserve_online_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Legacy trigger placeholder, overridden in 20260525000000_stock_reservation_trigger.sql
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reserve_online_stock ON public.online_order_items;
CREATE TRIGGER trg_reserve_online_stock
  AFTER INSERT ON online_order_items
  FOR EACH ROW
  EXECUTE FUNCTION reserve_online_stock();
