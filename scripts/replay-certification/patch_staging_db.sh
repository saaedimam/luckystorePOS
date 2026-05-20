#!/bin/bash
# Patch script for fixing the Supabase session_replication_role bug
# 
# Usage: ./patch_staging_db.sh [YOUR_DB_PASSWORD]

if [ -z "$1" ]; then
  echo "Usage: ./patch_staging_db.sh [YOUR_DB_PASSWORD]"
  exit 1
fi

export SUPABASE_DB_PASSWORD="$1"

echo "Applying patch to staging database..."

npx supabase db query "
BEGIN;

-- 1. Update the trigger function to check a local configuration variable
CREATE OR REPLACE FUNCTION public.log_stock_ledger_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS \$\$
BEGIN
  -- Bypass trigger if the 'luckystore.bypass_trigger' config is set
  IF current_setting('luckystore.bypass_trigger', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Only log if quantity actually changed
  IF NEW.qty IS DISTINCT FROM OLD.qty THEN
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
      NEW.store_id,
      NEW.item_id,
      OLD.qty,
      NEW.qty,
      NEW.qty - OLD.qty,
      'system_adjustment',
      'Stock level adjusted via system',
      gen_random_uuid(),
      jsonb_build_object('update_type', CASE 
        WHEN NEW.qty > OLD.qty THEN 'restock'
        ELSE 'removal'
      END)
    );
  END IF;
  
  RETURN NEW;
END;
\$\$;

-- 2. Update deduct_stock to use the local configuration variable instead of session_replication_role
CREATE OR REPLACE FUNCTION public.deduct_stock(p_store_id uuid, p_product_id uuid, p_quantity integer, p_metadata jsonb DEFAULT '{}'::jsonb, p_operation_id uuid DEFAULT NULL::uuid, p_expected_quantity integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS \$\$
DECLARE
  v_current_quantity integer;
  v_new_quantity integer;
  v_movement_id uuid;
  v_result jsonb;
BEGIN
  -- 1. Idempotency Check (Check if operation_id already applied)
  IF p_operation_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'success', true,
      'movement_id', movement_id,
      'previous_quantity', previous_quantity,
      'new_quantity', new_quantity,
      'deducted', -quantity_change,
      'idempotent_replay', true
    ) INTO v_result
    FROM public.stock_ledger
    WHERE movement_id = p_operation_id;

    IF v_result IS NOT NULL THEN
      RETURN v_result;
    END IF;
  END IF;

  -- 2. Fetch and Lock Stock Level
  SELECT qty INTO v_current_quantity
  FROM public.stock_levels
  WHERE store_id = p_store_id
    AND item_id = p_product_id
  FOR UPDATE;

  IF v_current_quantity IS NULL THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object('code', 'NO_STOCK_LEVEL', 'message', 'No stock record found'),
      'success', false
    );
  END IF;

  -- 3. Optimistic Concurrency Check
  IF p_expected_quantity IS NOT NULL AND v_current_quantity != p_expected_quantity THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object('code', 'STALE_QUANTITY', 'available', v_current_quantity, 'expected', p_expected_quantity),
      'success', false,
      'conflict', true
    );
  END IF;

  -- 4. Insufficient Stock Check
  IF v_current_quantity < p_quantity THEN
    RETURN jsonb_build_object(
      'error', jsonb_build_object('code', 'INSUFFICIENT_STOCK', 'available', v_current_quantity, 'requested', p_quantity),
      'success', false
    );
  END IF;

  v_new_quantity := v_current_quantity - p_quantity;
  v_movement_id := COALESCE(p_operation_id, gen_random_uuid());

  -- 5. Perform Atomic Updates
  -- Use transaction-local variable instead of session_replication_role
  PERFORM set_config('luckystore.bypass_trigger', 'true', true);
  
  UPDATE public.stock_levels
  SET qty = v_new_quantity
  WHERE store_id = p_store_id
    AND item_id = p_product_id;

  INSERT INTO public.stock_ledger (
    store_id, product_id, previous_quantity, new_quantity,
    quantity_change, transaction_type, reason, movement_id, metadata
  ) VALUES (
    p_store_id, p_product_id, v_current_quantity, v_new_quantity,
    -p_quantity, 'sale_deduction', 'POS transaction sale', v_movement_id, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'deducted', p_quantity
  );
END;
\$\$;

COMMIT;
" --linked

echo "Patch applied successfully!"
