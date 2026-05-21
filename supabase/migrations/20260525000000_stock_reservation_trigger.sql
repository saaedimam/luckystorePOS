-- =============================================================================
-- Migration: Add Stock Reservation Trigger & Fix Schema Gaps
-- =============================================================================

-- 1. Ensure delivery_zones exists (was missing in some envs)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID          NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  store_id     UUID          REFERENCES public.stores(id) ON DELETE CASCADE,
  store_lat    DECIMAL(10,8) NOT NULL,
  store_lng    DECIMAL(11,8) NOT NULL,
  radius_km    DECIMAL(5,2)  NOT NULL DEFAULT 5.0,
  delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 40,
  is_active    BOOLEAN       NOT NULL DEFAULT true,
  UNIQUE(tenant_id)
);

-- 2. Add reserved_online to products if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'reserved_online'
  ) THEN
    ALTER TABLE public.products ADD COLUMN reserved_online INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Trigger Function for stock reservation on products table
CREATE OR REPLACE FUNCTION public.reserve_online_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the products table reservation counter
  UPDATE public.products 
  SET reserved_online = reserved_online + NEW.quantity
  WHERE id = NEW.item_id;
  
  -- Also update stock_levels if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_levels' AND column_name='qty_reserved_online') THEN
    UPDATE public.stock_levels
    SET qty_reserved_online = COALESCE(qty_reserved_online, 0) + NEW.quantity
    WHERE item_id = NEW.item_id
    AND store_id = (SELECT store_id FROM public.online_orders WHERE id = NEW.order_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS trg_reserve_online_stock ON public.online_order_items;
CREATE TRIGGER trg_reserve_online_stock
  AFTER INSERT ON public.online_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_online_stock();

-- 5. Trigger for releasing reservation on cancellation or fulfillment
CREATE OR REPLACE FUNCTION public.release_online_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item record;
BEGIN
  -- Only trigger on status change to 'cancelled' or 'delivered'
  IF (NEW.status = 'cancelled' OR NEW.status = 'delivered') AND (OLD.status != 'cancelled' AND OLD.status != 'delivered') THEN
    FOR v_item IN SELECT * FROM public.online_order_items WHERE order_id = NEW.id
    LOOP
      -- Release products reservation
      UPDATE public.products 
      SET reserved_online = GREATEST(0, reserved_online - v_item.quantity)
      WHERE id = v_item.item_id;

      -- Release stock_levels reservation
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_levels' AND column_name='qty_reserved_online') THEN
        UPDATE public.stock_levels
        SET qty_reserved_online = GREATEST(0, COALESCE(qty_reserved_online, 0) - v_item.quantity)
        WHERE item_id = v_item.item_id
        AND store_id = NEW.store_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_online_stock ON public.online_orders;
CREATE TRIGGER trg_release_online_stock
  AFTER UPDATE OF status ON public.online_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.release_online_stock();
