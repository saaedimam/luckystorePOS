-- stock_deduce.sql
-- Atomic RPC to deduct stock from a store/item combination.
-- Uses SELECT ... FOR UPDATE to lock the row and prevent race conditions
-- under concurrent access (e.g. two POS terminals selling the same item).
--
-- Unlike the earlier decrement_stock() which uses an implicit UPDATE lock,
-- this function explicitly locks the row first, double-checks stock, then
-- deducts and writes a stock_movement record in a single transaction.
--
-- Returns the new quantity after deduction.

CREATE OR REPLACE FUNCTION public.stock_deduce(
  p_store_id uuid,
  p_item_id uuid,
  p_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_qty integer;
  v_new_qty integer;
  v_movement_id uuid;
BEGIN
  -- Validate inputs
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity to deduct must be positive, got %', p_quantity;
  END IF;

  -- Lock the row for update to serialize concurrent deductions
  SELECT COALESCE(qty, 0) INTO v_current_qty
  FROM public.stock_levels
  WHERE store_id = p_store_id AND item_id = p_item_id
  FOR UPDATE;

  -- Check sufficient stock
  IF v_current_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for item % in store %. Available: %, requested: %',
      p_item_id, p_store_id, v_current_qty, p_quantity;
  END IF;

  -- Perform the deduction
  UPDATE public.stock_levels
  SET qty = qty - p_quantity
  WHERE store_id = p_store_id AND item_id = p_item_id;

  v_new_qty := v_current_qty - p_quantity;

  -- Write stock movement record for audit trail
  INSERT INTO public.stock_movements (store_id, item_id, delta, reason, meta, performed_by)
  VALUES (
    p_store_id,
    p_item_id,
    -p_quantity,
    'sale',
    jsonb_build_object(
      'source', 'stock_deduce_rpc',
      'new_qty', v_new_qty,
      'previous_qty', v_current_qty
    ),
    COALESCE(
      (SELECT id FROM public.users WHERE auth_id = auth.uid()),
      NULL
    )
  )
  RETURNING id INTO v_movement_id;

  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'new_quantity', v_new_qty,
    'previous_quantity', v_current_qty,
    'deducted', p_quantity
  );
END;
$$;

-- Restrict execution: only service_role can call this directly
REVOKE ALL ON FUNCTION public.stock_deduce(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stock_deduce(uuid, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.stock_deduce(uuid, uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.stock_deduce(uuid, uuid, integer) TO service_role;