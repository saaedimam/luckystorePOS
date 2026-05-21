-- =============================================================================
-- Migration: Reserve Online Stock Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION reserve_online_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE inventory 
  SET reserved_online = reserved_online + NEW.quantity
  WHERE product_id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reserve_online_stock ON public.online_order_items;
CREATE TRIGGER trg_reserve_online_stock
  AFTER INSERT ON online_order_items
  FOR EACH ROW
  EXECUTE FUNCTION reserve_online_stock();
