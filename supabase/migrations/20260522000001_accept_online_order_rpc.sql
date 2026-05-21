-- =============================================================================
-- Migration: Accept Online Order RPC and Schema Updates
-- =============================================================================

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='online_orders' AND column_name='accepted_at') THEN
    ALTER TABLE public.online_orders ADD COLUMN accepted_at timestamptz;
  END IF;
END $$;

ALTER TABLE public.online_orders DROP CONSTRAINT IF EXISTS online_orders_status_check;
ALTER TABLE public.online_orders ADD CONSTRAINT online_orders_status_check 
  CHECK (status IN ('PENDING', 'ACCEPTED', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'confirmed'));

CREATE OR REPLACE FUNCTION accept_online_order(
  p_operation_id UUID,
  p_order_id UUID,
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Idempotency check
  IF EXISTS (SELECT 1 FROM operation_log WHERE operation_id = p_operation_id) THEN
    RETURN jsonb_build_object('status', 'already_processed', 'order_id', p_order_id);
  END IF;

  -- Update order status
  UPDATE online_orders 
  SET status = 'ACCEPTED', accepted_at = NOW()
  WHERE id = p_order_id AND tenant_id = p_tenant_id AND status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not pending';
  END IF;

  -- Log operation for idempotency
  INSERT INTO operation_log (operation_id, action, created_at)
  VALUES (p_operation_id, 'accept_online_order', NOW());

  RETURN jsonb_build_object('status', 'accepted', 'order_id', p_order_id);
END;
$$;
