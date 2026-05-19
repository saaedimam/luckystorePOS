-- Migration: Increment Stock RPC
-- Date: 2026-05-19
-- Purpose: Safely increment stock levels and write to stock_ledger atomically.

CREATE OR REPLACE FUNCTION public.increment_stock(
  p_store_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock_level_id uuid;
  v_current_quantity integer;
  v_new_quantity integer;
  v_movement_id uuid;
BEGIN
  -- Validate inputs
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object('code', 'INVALID_QUANTITY', 'message', 'Quantity must be positive'),
      'movement_id', NULL, 'previous_quantity', 0, 'new_quantity', 0, 'added', 0
    );
  END IF;

  -- Lock or create the row
  SELECT id, COALESCE(qty, 0) INTO v_stock_level_id, v_current_quantity
  FROM public.stock_levels
  WHERE store_id = p_store_id AND item_id = p_product_id
  FOR UPDATE;

  IF v_stock_level_id IS NULL THEN
    -- Try to insert
    INSERT INTO public.stock_levels (store_id, item_id, qty)
    VALUES (p_store_id, p_product_id, p_quantity)
    RETURNING id, qty INTO v_stock_level_id, v_new_quantity;
    
    v_current_quantity := 0;
  ELSE
    -- Update existing
    UPDATE public.stock_levels
    SET qty = qty + p_quantity
    WHERE id = v_stock_level_id
    RETURNING qty INTO v_new_quantity;
  END IF;

  -- Write to stock ledger
  INSERT INTO public.stock_ledger (
    store_id,
    product_id,
    previous_quantity,
    new_quantity,
    quantity_change,
    transaction_type,
    reason,
    movement_id,
    metadata,
    performed_by
  ) VALUES (
    p_store_id,
    p_product_id,
    v_current_quantity,
    v_new_quantity,
    p_quantity,
    'purchase_add',
    'Procurement Scan',
    gen_random_uuid(),
    p_metadata,
    auth.uid()
  ) RETURNING movement_id INTO v_movement_id;

  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'new_quantity', v_new_quantity,
    'previous_quantity', v_current_quantity,
    'added', p_quantity
  );
END;
$$;
