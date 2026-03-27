-- Phase 1: Stock Adjustments & Audit Trail
-- 1) Ensure stock_movements has the columns we need (idempotent)
-- 2) Add a reason CHECK constraint for allowed values
-- 3) Create an adjust_stock RPC that atomically adjusts stock + writes a movement
-- 4) RLS: allow admin/manager/stock to insert movements directly (for the edge function)

-- ---------------------------------------------------------------------------
-- 1) Schema hardening for stock_movements
-- ---------------------------------------------------------------------------
ALTER TABLE public.stock_movements
  ADD COLUMN IF NOT EXISTS notes text;

-- Index for efficient querying by reason
CREATE INDEX IF NOT EXISTS idx_stock_movements_reason
  ON public.stock_movements(reason);

-- Composite index for item + store movement history
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_store
  ON public.stock_movements(item_id, store_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2) adjust_stock RPC — atomic stock adjustment + movement log
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_store_id uuid,
  p_item_id uuid,
  p_delta integer,
  p_reason text,
  p_notes text DEFAULT NULL,
  p_performed_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_qty integer;
  v_movement_id uuid;
BEGIN
  -- Validate reason
  IF p_reason NOT IN (
    'received', 'damaged', 'lost', 'correction',
    'returned', 'transfer_in', 'transfer_out',
    'sale', 'import', 'expired', 'other'
  ) THEN
    RAISE EXCEPTION 'Invalid adjustment reason: %', p_reason;
  END IF;

  -- Validate delta is not zero
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Adjustment quantity cannot be zero';
  END IF;

  -- Upsert stock level
  INSERT INTO public.stock_levels (store_id, item_id, qty)
  VALUES (p_store_id, p_item_id, GREATEST(0, p_delta))
  ON CONFLICT (store_id, item_id)
  DO UPDATE SET qty = GREATEST(0, public.stock_levels.qty + p_delta);

  -- Get the new quantity
  SELECT qty INTO v_new_qty
  FROM public.stock_levels
  WHERE store_id = p_store_id AND item_id = p_item_id;

  -- Write movement record
  INSERT INTO public.stock_movements (store_id, item_id, delta, reason, meta, performed_by)
  VALUES (
    p_store_id,
    p_item_id,
    p_delta,
    p_reason,
    jsonb_build_object(
      'notes', COALESCE(p_notes, ''),
      'source', 'manual_adjustment',
      'new_qty', v_new_qty
    ),
    p_performed_by
  )
  RETURNING id INTO v_movement_id;

  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'new_qty', v_new_qty,
    'delta', p_delta,
    'reason', p_reason
  );
END;
$$;

-- Restrict access: only service_role can call this RPC
REVOKE ALL ON FUNCTION public.adjust_stock(uuid, uuid, integer, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adjust_stock(uuid, uuid, integer, text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.adjust_stock(uuid, uuid, integer, text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, uuid, integer, text, text, uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- 3) RLS for stock_movements INSERT (admin/manager/stock roles)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "stock_movements_insert_staff" ON public.stock_movements;
CREATE POLICY "stock_movements_insert_staff"
  ON public.stock_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.auth_id = (SELECT auth.uid())
        AND u.role IN ('admin', 'manager', 'stock')
    )
  );

-- ---------------------------------------------------------------------------
-- 4) get_stock_movements RPC — paginated movement history
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_stock_movements(
  p_store_id uuid DEFAULT NULL,
  p_item_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  store_id uuid,
  item_id uuid,
  delta integer,
  reason text,
  notes text,
  meta jsonb,
  performed_by uuid,
  performer_name text,
  item_name text,
  store_code text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.store_id,
    sm.item_id,
    sm.delta,
    sm.reason,
    (sm.meta ->> 'notes')::text AS notes,
    sm.meta,
    sm.performed_by,
    u.full_name AS performer_name,
    i.name AS item_name,
    s.code AS store_code,
    sm.created_at
  FROM public.stock_movements sm
  LEFT JOIN public.users u ON u.id = sm.performed_by
  LEFT JOIN public.items i ON i.id = sm.item_id
  LEFT JOIN public.stores s ON s.id = sm.store_id
  WHERE (p_store_id IS NULL OR sm.store_id = p_store_id)
    AND (p_item_id IS NULL OR sm.item_id = p_item_id)
  ORDER BY sm.created_at DESC
  LIMIT LEAST(p_limit, 200)
  OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_stock_movements(uuid, uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_stock_movements(uuid, uuid, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_stock_movements(uuid, uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stock_movements(uuid, uuid, integer, integer) TO service_role;
