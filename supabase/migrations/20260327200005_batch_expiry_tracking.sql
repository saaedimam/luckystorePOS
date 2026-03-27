-- Phase 6: Batch & Expiry Tracking
-- 1) item_batches table — per lot tracking with expiry dates
-- 2) get_expiring_batches RPC — alert dashboard with items expiring soon
-- 3) consume_batch_stock RPC — optionally deduct from specific batch (FIFO helper)

-- ---------------------------------------------------------------------------
-- 1) item_batches table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.item_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  store_id        uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  batch_number    text NOT NULL,            -- e.g. "LOT-2024-001" or PO ref
  qty             integer NOT NULL DEFAULT 0 CHECK (qty >= 0),
  manufactured_at date,
  expires_at      date,
  notes           text,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'expired', 'consumed', 'recalled')),
  po_id           uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_item_batches_updated_at ON public.item_batches;
CREATE TRIGGER set_item_batches_updated_at
  BEFORE UPDATE ON public.item_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_item_batches_item_store
  ON public.item_batches(item_id, store_id);
CREATE INDEX IF NOT EXISTS idx_item_batches_expires_at
  ON public.item_batches(expires_at)
  WHERE status = 'active';

-- RLS
ALTER TABLE public.item_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_batches_select" ON public.item_batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "item_batches_write" ON public.item_batches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = (SELECT auth.uid())
        AND u.role IN ('admin', 'manager', 'stock')
    )
  );

-- ---------------------------------------------------------------------------
-- 2) RPC: get_expiring_batches
-- Returns active batches expiring within the next `p_days` days.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_expiring_batches(
  p_store_id  uuid,
  p_days      integer DEFAULT 30
)
RETURNS TABLE (
  batch_id      uuid,
  batch_number  text,
  item_id       uuid,
  item_name     text,
  sku           text,
  qty           integer,
  expires_at    date,
  days_left     integer,
  status        text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT
    b.id            AS batch_id,
    b.batch_number,
    i.id            AS item_id,
    i.name          AS item_name,
    i.sku,
    b.qty,
    b.expires_at,
    (b.expires_at - CURRENT_DATE)::integer AS days_left,
    b.status
  FROM public.item_batches b
  JOIN public.items i ON i.id = b.item_id
  WHERE b.store_id = p_store_id
    AND b.status   = 'active'
    AND b.qty > 0
    AND b.expires_at IS NOT NULL
    AND b.expires_at <= (CURRENT_DATE + p_days)
  ORDER BY b.expires_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_expiring_batches(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_expiring_batches(uuid, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) RPC: add_batch_and_adjust_stock
-- Convenience function to create a batch record AND call adjust_stock atomically.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_batch_and_adjust_stock(
  p_store_id      uuid,
  p_item_id       uuid,
  p_batch_number  text,
  p_qty           integer,
  p_expires_at    date DEFAULT NULL,
  p_manufactured_at date DEFAULT NULL,
  p_notes         text DEFAULT NULL,
  p_po_id         uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_batch_id uuid;
  v_user_id  uuid;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE auth_id = (SELECT auth.uid());
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_qty <= 0 THEN RAISE EXCEPTION 'Batch quantity must be positive'; END IF;

  -- Create batch record
  INSERT INTO public.item_batches (item_id, store_id, batch_number, qty, expires_at, manufactured_at, notes, po_id)
  VALUES (p_item_id, p_store_id, p_batch_number, p_qty, p_expires_at, p_manufactured_at, p_notes, p_po_id)
  RETURNING id INTO v_batch_id;

  -- Increment stock levels via existing RPC
  PERFORM public.adjust_stock(
    p_store_id,
    p_item_id,
    p_qty,
    'received',
    'Batch received: ' || p_batch_number,
    v_user_id
  );

  RETURN v_batch_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_batch_and_adjust_stock(uuid, uuid, text, integer, date, date, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_batch_and_adjust_stock(uuid, uuid, text, integer, date, date, text, uuid) TO authenticated;
