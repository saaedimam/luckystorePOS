-- Server-authoritative sale execution: override token + partial fulfillment + immutable audit.

CREATE TABLE IF NOT EXISTS public.pos_override_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE,
  reason text NOT NULL,
  affected_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pos_override_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pot_select ON public.pos_override_tokens;
CREATE POLICY pot_select ON public.pos_override_tokens
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role IN ('admin', 'manager')
  )
);

CREATE TABLE IF NOT EXISTS public.sale_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id),
  client_transaction_id text NOT NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id),
  operator_user_id uuid REFERENCES public.users(id),
  status text NOT NULL,
  before_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  override_used boolean NOT NULL DEFAULT false,
  override_user_id uuid REFERENCES public.users(id),
  override_reason text,
  stock_delta jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sal_select ON public.sale_audit_log;
CREATE POLICY sal_select ON public.sale_audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role IN ('admin', 'manager')
  )
);

CREATE OR REPLACE FUNCTION public.prevent_sale_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'sale_audit_log is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_sale_audit_log_update ON public.sale_audit_log;
CREATE TRIGGER trg_prevent_sale_audit_log_update
BEFORE UPDATE OR DELETE ON public.sale_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sale_audit_log_mutation();

CREATE OR REPLACE FUNCTION public.issue_pos_override_token(
  p_store_id uuid,
  p_reason text,
  p_affected_items jsonb DEFAULT '[]'::jsonb,
  p_ttl_minutes integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  v_plain_token text;
BEGIN
  SELECT id, role INTO v_user_id, v_role
  FROM public.users
  WHERE auth_id = auth.uid();

  IF v_user_id IS NULL OR v_role NOT IN ('admin', 'manager') THEN
    RETURN jsonb_build_object(
      'status', 'REJECTED',
      'message', 'Manager/Admin role required'
    );
  END IF;

  v_plain_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.pos_override_tokens (
    store_id, issued_by, token_hash, reason, affected_items, expires_at
  ) VALUES (
    p_store_id,
    v_user_id,
    encode(digest(v_plain_token, 'sha256'), 'hex'),
    p_reason,
    COALESCE(p_affected_items, '[]'::jsonb),
    now() + make_interval(mins => GREATEST(1, p_ttl_minutes))
  );

  RETURN jsonb_build_object(
    'status', 'SUCCESS',
    'override_token', v_plain_token,
    'expires_at', (now() + make_interval(mins => GREATEST(1, p_ttl_minutes)))
  );
END;
$$;

DROP FUNCTION IF EXISTS public.complete_sale(uuid, uuid, uuid, jsonb, jsonb, numeric, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.complete_sale(
  p_store_id uuid,
  p_cashier_id uuid,
  p_session_id uuid DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb,
  p_payments jsonb DEFAULT '[]'::jsonb,
  p_discount numeric DEFAULT 0,
  p_client_transaction_id text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_snapshot jsonb DEFAULT NULL,
  p_fulfillment_policy text DEFAULT 'STRICT',
  p_override_token text DEFAULT NULL,
  p_override_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing record;
  v_item record;
  v_live record;
  v_sale_id uuid;
  v_sale_number text;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_tendered numeric(12,2) := 0;
  v_change numeric(12,2) := 0;
  v_status text := 'SUCCESS';
  v_adjustments jsonb := '[]'::jsonb;
  v_partial jsonb := '[]'::jsonb;
  v_conflict_reason text;
  v_user_id uuid;
  v_user_role text;
  v_override_row record;
  v_override_required boolean := false;
  v_stock_delta jsonb := '[]'::jsonb;
  v_fulfilled_qty integer;
  v_backordered_qty integer;
BEGIN
  SELECT id, role INTO v_user_id, v_user_role
  FROM public.users
  WHERE auth_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('status', 'REJECTED', 'message', 'Not authenticated');
  END IF;

  IF p_client_transaction_id IS NULL OR btrim(p_client_transaction_id) = '' THEN
    RETURN jsonb_build_object(
      'status', 'REJECTED',
      'conflict_reason', 'client_transaction_id_required',
      'message', 'client_transaction_id is required',
      'adjustments', '[]'::jsonb,
      'partial_fulfillment', '[]'::jsonb
    );
  END IF;

  SELECT id, sale_number, subtotal, discount_amount, total_amount, amount_tendered, change_due
    INTO v_existing
  FROM public.sales
  WHERE store_id = p_store_id
    AND client_transaction_id = p_client_transaction_id
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'SUCCESS',
      'sale_id', v_existing.id,
      'sale_number', v_existing.sale_number,
      'subtotal', COALESCE(v_existing.subtotal, 0),
      'discount', COALESCE(v_existing.discount_amount, 0),
      'total_amount', COALESCE(v_existing.total_amount, 0),
      'tendered', COALESCE(v_existing.amount_tendered, 0),
      'change_due', COALESCE(v_existing.change_due, 0),
      'adjustments', '[]'::jsonb,
      'partial_fulfillment', '[]'::jsonb
    );
  END IF;

  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(COALESCE(p_items, '[]'::jsonb)) AS x(
      item_id uuid,
      qty integer,
      unit_price numeric,
      cost numeric,
      discount numeric
    )
  LOOP
    SELECT i.id, i.name, i.active, i.price, COALESCE(sl.qty_on_hand, 0) AS qty_on_hand
      INTO v_live
    FROM public.items i
    LEFT JOIN public.stock_levels sl
      ON sl.item_id = i.id AND sl.store_id = p_store_id
    WHERE i.id = v_item.item_id;

    IF v_live.id IS NULL OR v_live.active IS DISTINCT FROM true THEN
      v_conflict_reason := 'deleted_or_inactive_product';
      RETURN jsonb_build_object(
        'status', 'CONFLICT',
        'conflict_reason', v_conflict_reason,
        'message', 'Product deleted/inactive',
        'adjustments', v_adjustments,
        'partial_fulfillment', v_partial
      );
    END IF;

    IF ROUND(COALESCE(v_item.unit_price, 0), 2) < ROUND(COALESCE(v_live.price, 0), 2) THEN
      v_override_required := true;
      v_adjustments := v_adjustments || jsonb_build_object(
        'item_id', v_item.item_id,
        'type', 'price_increase',
        'snapshot_price', v_item.unit_price,
        'server_price', v_live.price
      );
    ELSIF ROUND(COALESCE(v_item.unit_price, 0), 2) > ROUND(COALESCE(v_live.price, 0), 2) THEN
      v_status := 'ADJUSTED';
      v_adjustments := v_adjustments || jsonb_build_object(
        'item_id', v_item.item_id,
        'type', 'price_decrease_auto_adjust',
        'snapshot_price', v_item.unit_price,
        'applied_price', v_live.price
      );
    END IF;

    IF COALESCE(v_live.qty_on_hand, 0) < COALESCE(v_item.qty, 0) THEN
      IF UPPER(COALESCE(p_fulfillment_policy, 'STRICT')) = 'PARTIAL_ALLOWED' THEN
        v_fulfilled_qty := GREATEST(COALESCE(v_live.qty_on_hand, 0), 0);
        v_backordered_qty := GREATEST(COALESCE(v_item.qty, 0) - v_fulfilled_qty, 0);
        v_partial := v_partial || jsonb_build_object(
          'item_id', v_item.item_id,
          'requested_qty', v_item.qty,
          'fulfilled_qty', v_fulfilled_qty,
          'backordered_qty', v_backordered_qty,
          'remaining_stock', GREATEST(COALESCE(v_live.qty_on_hand, 0) - v_fulfilled_qty, 0)
        );
      ELSE
        RETURN jsonb_build_object(
          'status', 'REJECTED',
          'conflict_reason', 'insufficient_stock_strict_policy',
          'message', format('Insufficient stock for %s', v_live.name),
          'adjustments', v_adjustments,
          'partial_fulfillment', v_partial
        );
      END IF;
    END IF;
  END LOOP;

  IF jsonb_array_length(v_partial) > 0 THEN
    RETURN jsonb_build_object(
      'status', 'PARTIAL_FULFILLMENT',
      'conflict_reason', 'partial_fulfillment_required',
      'message', 'Server computed partial fulfillment proposal',
      'adjustments', v_adjustments,
      'partial_fulfillment', v_partial
    );
  END IF;

  IF v_override_required THEN
    IF p_override_token IS NULL OR btrim(p_override_token) = '' THEN
      RETURN jsonb_build_object(
        'status', 'REJECTED',
        'conflict_reason', 'override_token_required',
        'message', 'Manager override token required for price increase',
        'adjustments', v_adjustments,
        'partial_fulfillment', v_partial
      );
    END IF;

    SELECT *
      INTO v_override_row
    FROM public.pos_override_tokens t
    WHERE t.store_id = p_store_id
      AND t.token_hash = encode(digest(p_override_token, 'sha256'), 'hex')
      AND t.used_at IS NULL
      AND t.expires_at > now()
    LIMIT 1;

    IF v_override_row.id IS NULL OR v_user_role NOT IN ('admin', 'manager') THEN
      RETURN jsonb_build_object(
        'status', 'REJECTED',
        'conflict_reason', 'invalid_override_token',
        'message', 'Invalid or expired override token',
        'adjustments', v_adjustments,
        'partial_fulfillment', v_partial
      );
    END IF;

    UPDATE public.pos_override_tokens
    SET used_at = now(),
        used_by = v_user_id
    WHERE id = v_override_row.id;
  END IF;

  INSERT INTO public.sales (
    store_id, cashier_id, session_id, status, notes, client_transaction_id
  ) VALUES (
    p_store_id, p_cashier_id, p_session_id, 'completed', p_notes, p_client_transaction_id
  ) RETURNING id, sale_number INTO v_sale_id, v_sale_number;

  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(COALESCE(p_items, '[]'::jsonb)) AS x(
      item_id uuid,
      qty integer,
      unit_price numeric,
      cost numeric,
      discount numeric
    )
  LOOP
    SELECT i.price, i.name INTO v_live
    FROM public.items i
    WHERE i.id = v_item.item_id;

    INSERT INTO public.sale_items (
      sale_id, item_id, qty, unit_price, cost, discount, line_total
    ) VALUES (
      v_sale_id,
      v_item.item_id,
      v_item.qty,
      LEAST(COALESCE(v_item.unit_price, 0), COALESCE(v_live.price, 0)),
      COALESCE(v_item.cost, 0),
      COALESCE(v_item.discount, 0),
      ROUND((LEAST(COALESCE(v_item.unit_price, 0), COALESCE(v_live.price, 0)) - COALESCE(v_item.discount, 0)) * v_item.qty, 2)
    );

    v_subtotal := v_subtotal + ROUND(
      (LEAST(COALESCE(v_item.unit_price, 0), COALESCE(v_live.price, 0)) - COALESCE(v_item.discount, 0)) * v_item.qty,
      2
    );

    PERFORM public.adjust_stock(
      p_store_id,
      v_item.item_id,
      -v_item.qty,
      'sale',
      'Sale: ' || v_sale_number,
      v_user_id
    );

    v_stock_delta := v_stock_delta || jsonb_build_object(
      'item_id', v_item.item_id,
      'delta_qty', -v_item.qty
    );
  END LOOP;

  v_total := GREATEST(ROUND(v_subtotal - COALESCE(p_discount, 0), 2), 0);

  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(COALESCE(p_payments, '[]'::jsonb)) AS x(
      payment_method_id uuid,
      amount numeric,
      reference text
    )
  LOOP
    v_tendered := v_tendered + COALESCE(v_item.amount, 0);
    INSERT INTO public.sale_payments(sale_id, payment_method_id, amount, reference)
    VALUES (v_sale_id, v_item.payment_method_id, v_item.amount, v_item.reference);
  END LOOP;

  IF v_tendered < v_total THEN
    RETURN jsonb_build_object(
      'status', 'REJECTED',
      'conflict_reason', 'payment_insufficient',
      'message', 'Payment insufficient',
      'adjustments', v_adjustments,
      'partial_fulfillment', v_partial
    );
  END IF;

  v_change := GREATEST(ROUND(v_tendered - v_total, 2), 0);
  UPDATE public.sales
  SET subtotal = v_subtotal,
      discount_amount = COALESCE(p_discount, 0),
      total_amount = v_total,
      amount_tendered = v_tendered,
      change_due = v_change
  WHERE id = v_sale_id;

  INSERT INTO public.sale_audit_log (
    sale_id,
    client_transaction_id,
    store_id,
    operator_user_id,
    status,
    before_state,
    after_state,
    override_used,
    override_user_id,
    override_reason,
    stock_delta
  ) VALUES (
    v_sale_id,
    p_client_transaction_id,
    p_store_id,
    v_user_id,
    v_status,
    jsonb_build_object('snapshot', COALESCE(p_snapshot, '{}'::jsonb)),
    jsonb_build_object(
      'sale_id', v_sale_id,
      'subtotal', v_subtotal,
      'discount', COALESCE(p_discount, 0),
      'total_amount', v_total,
      'tendered', v_tendered,
      'change_due', v_change
    ),
    v_override_required,
    CASE WHEN v_override_required THEN v_user_id ELSE NULL END,
    p_override_reason,
    v_stock_delta
  );

  RETURN jsonb_build_object(
    'status', v_status,
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'subtotal', v_subtotal,
    'discount', COALESCE(p_discount, 0),
    'total_amount', v_total,
    'tendered', v_tendered,
    'change_due', v_change,
    'adjustments', v_adjustments,
    'partial_fulfillment', v_partial,
    'conflict_reason', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_pos_override_token(uuid, text, jsonb, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_pos_override_token(uuid, text, jsonb, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_sale(uuid, uuid, uuid, jsonb, jsonb, numeric, text, text, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_sale(uuid, uuid, uuid, jsonb, jsonb, numeric, text, text, jsonb, text, text, text) TO authenticated;
