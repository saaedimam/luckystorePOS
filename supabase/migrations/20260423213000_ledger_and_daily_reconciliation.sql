-- Retail-grade accounting and reconciliation layer.
-- Adds double-entry ledger, immutable posting, sale->ledger linkage, and daily reconciliation RPC.

CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'CONTRA_REVENUE')),
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, code)
);

CREATE TABLE IF NOT EXISTS public.ledger_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid,
  source_ref text,
  status text NOT NULL DEFAULT 'POSTED' CHECK (status IN ('DRAFT', 'POSTED', 'VOIDED')),
  override_used boolean NOT NULL DEFAULT false,
  risk_flag boolean NOT NULL DEFAULT false,
  risk_note text,
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.ledger_batches(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  sale_id uuid REFERENCES public.sales(id),
  line_ref text,
  debit numeric(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  annotation jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit = 0 AND credit > 0) OR (credit = 0 AND debit > 0))
);

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS ledger_batch_id uuid REFERENCES public.ledger_batches(id),
  ADD COLUMN IF NOT EXISTS fulfilled_subtotal numeric(12,2),
  ADD COLUMN IF NOT EXISTS backordered_subtotal numeric(12,2);

CREATE INDEX IF NOT EXISTS idx_ledger_batches_store_posted ON public.ledger_batches(store_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_batch ON public.ledger_entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_sales_ledger_batch ON public.sales(ledger_batch_id);

ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS la_select ON public.ledger_accounts;
CREATE POLICY la_select ON public.ledger_accounts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS lb_select ON public.ledger_batches;
CREATE POLICY lb_select ON public.ledger_batches FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_id = auth.uid()
      AND u.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS le_select ON public.ledger_entries;
CREATE POLICY le_select ON public.ledger_entries FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.ledger_batches lb
    JOIN public.users u ON u.auth_id = auth.uid()
    WHERE lb.id = ledger_entries.batch_id
      AND u.role IN ('admin', 'manager')
  )
);

CREATE OR REPLACE FUNCTION public.prevent_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Ledger is immutable once posted';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_ledger_entries_mutation ON public.ledger_entries;
CREATE TRIGGER trg_prevent_ledger_entries_mutation
BEFORE UPDATE OR DELETE ON public.ledger_entries
FOR EACH ROW
EXECUTE FUNCTION public.prevent_ledger_mutation();

DROP TRIGGER IF EXISTS trg_prevent_ledger_batches_mutation ON public.ledger_batches;
CREATE TRIGGER trg_prevent_ledger_batches_mutation
BEFORE UPDATE OR DELETE ON public.ledger_batches
FOR EACH ROW
WHEN (OLD.status = 'POSTED')
EXECUTE FUNCTION public.prevent_ledger_mutation();

CREATE OR REPLACE FUNCTION public.ensure_sale_ledger_accounts(p_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.ledger_accounts (store_id, code, name, account_type, is_system)
  VALUES
    (p_store_id, '1000_CASH', 'Cash on Hand', 'ASSET', true),
    (p_store_id, '1010_BANK', 'Bank / Mobile Settlement', 'ASSET', true),
    (p_store_id, '4000_SALES_REVENUE', 'Sales Revenue (Gross)', 'REVENUE', true),
    (p_store_id, '5000_COGS', 'Cost of Goods Sold', 'EXPENSE', true),
    (p_store_id, '1200_INVENTORY', 'Inventory Asset', 'ASSET', true),
    (p_store_id, '5100_DISCOUNT_ABSORPTION', 'Discount Absorption (MRP delta)', 'EXPENSE', true)
  ON CONFLICT (store_id, code) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_payment_ledger_account(
  p_store_id uuid,
  p_payment_method_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type public.payment_type;
  v_account uuid;
BEGIN
  SELECT pm.type INTO v_type
  FROM public.payment_methods pm
  WHERE pm.id = p_payment_method_id
    AND pm.store_id = p_store_id
  LIMIT 1;

  IF v_type = 'cash' THEN
    SELECT id INTO v_account
    FROM public.ledger_accounts
    WHERE store_id = p_store_id
      AND code = '1000_CASH';
  ELSE
    SELECT id INTO v_account
    FROM public.ledger_accounts
    WHERE store_id = p_store_id
      AND code = '1010_BANK';
  END IF;

  RETURN v_account;
END;
$$;

DROP FUNCTION IF EXISTS public.complete_sale(uuid, uuid, uuid, jsonb, jsonb, numeric, text, text, jsonb, text, text, text);

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
  v_payment record;
  v_live record;
  v_sale_id uuid;
  v_sale_number text;
  v_subtotal numeric(12,2) := 0;
  v_fulfilled_subtotal numeric(12,2) := 0;
  v_backordered_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_tendered numeric(12,2) := 0;
  v_change numeric(12,2) := 0;
  v_status text := 'SUCCESS';
  v_adjustments jsonb := '[]'::jsonb;
  v_partial jsonb := '[]'::jsonb;
  v_user_id uuid;
  v_user_role text;
  v_override_row record;
  v_override_required boolean := false;
  v_stock_delta jsonb := '[]'::jsonb;
  v_fulfilled_qty integer;
  v_backordered_qty integer;
  v_line_price numeric(12,2);
  v_line_total numeric(12,2);
  v_mrp numeric(12,2);
  v_discount_absorption numeric(12,2) := 0;
  v_cogs_total numeric(12,2) := 0;
  v_batch_id uuid;
  v_revenue_account uuid;
  v_inventory_account uuid;
  v_cogs_account uuid;
  v_discount_account uuid;
  v_payment_account uuid;
  v_gross_revenue numeric(12,2) := 0;
BEGIN
  PERFORM public.ensure_sale_ledger_accounts(p_store_id);

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

  SELECT id, sale_number, subtotal, discount_amount, total_amount, amount_tendered, change_due, ledger_batch_id
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
      'ledger_batch_id', v_existing.ledger_batch_id,
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
    SELECT i.id, i.name, i.active, i.price, i.mrp, COALESCE(sl.qty_on_hand, 0) AS qty_on_hand
      INTO v_live
    FROM public.items i
    LEFT JOIN public.stock_levels sl
      ON sl.item_id = i.id AND sl.store_id = p_store_id
    WHERE i.id = v_item.item_id;

    IF v_live.id IS NULL OR v_live.active IS DISTINCT FROM true THEN
      RETURN jsonb_build_object(
        'status', 'CONFLICT',
        'conflict_reason', 'deleted_or_inactive_product',
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
    SELECT i.price, i.mrp, i.cost INTO v_live
    FROM public.items i
    WHERE i.id = v_item.item_id;

    v_line_price := LEAST(COALESCE(v_item.unit_price, 0), COALESCE(v_live.price, 0));
    v_line_total := ROUND((v_line_price - COALESCE(v_item.discount, 0)) * v_item.qty, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_fulfilled_subtotal := v_fulfilled_subtotal + v_line_total;

    v_mrp := COALESCE(v_live.mrp, v_line_price);
    v_discount_absorption := v_discount_absorption + GREATEST((v_mrp - v_line_price), 0) * v_item.qty;
    v_cogs_total := v_cogs_total + (COALESCE(v_item.cost, COALESCE(v_live.cost, 0)) * v_item.qty);
    v_gross_revenue := v_gross_revenue + (v_line_total + GREATEST((v_mrp - v_line_price), 0) * v_item.qty);

    INSERT INTO public.sale_items (
      sale_id, item_id, qty, unit_price, cost, discount, line_total
    ) VALUES (
      v_sale_id,
      v_item.item_id,
      v_item.qty,
      v_line_price,
      COALESCE(v_item.cost, 0),
      COALESCE(v_item.discount, 0),
      v_line_total
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

  FOR v_payment IN
    SELECT * FROM jsonb_to_recordset(COALESCE(p_payments, '[]'::jsonb)) AS x(
      payment_method_id uuid,
      amount numeric,
      reference text
    )
  LOOP
    v_tendered := v_tendered + COALESCE(v_payment.amount, 0);
    INSERT INTO public.sale_payments(sale_id, payment_method_id, amount, reference)
    VALUES (v_sale_id, v_payment.payment_method_id, v_payment.amount, v_payment.reference);
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
      fulfilled_subtotal = v_fulfilled_subtotal,
      backordered_subtotal = v_backordered_subtotal,
      discount_amount = COALESCE(p_discount, 0),
      total_amount = v_total,
      amount_tendered = v_tendered,
      change_due = v_change
  WHERE id = v_sale_id;

  INSERT INTO public.ledger_batches (
    store_id, source_type, source_id, source_ref, status, override_used, risk_flag, risk_note, created_by
  )
  VALUES (
    p_store_id,
    'sale',
    v_sale_id,
    p_client_transaction_id,
    'POSTED',
    v_override_required,
    v_override_required,
    CASE WHEN v_override_required THEN COALESCE(p_override_reason, 'override_applied') END,
    v_user_id
  )
  RETURNING id INTO v_batch_id;

  SELECT id INTO v_revenue_account FROM public.ledger_accounts WHERE store_id = p_store_id AND code = '4000_SALES_REVENUE';
  SELECT id INTO v_inventory_account FROM public.ledger_accounts WHERE store_id = p_store_id AND code = '1200_INVENTORY';
  SELECT id INTO v_cogs_account FROM public.ledger_accounts WHERE store_id = p_store_id AND code = '5000_COGS';
  SELECT id INTO v_discount_account FROM public.ledger_accounts WHERE store_id = p_store_id AND code = '5100_DISCOUNT_ABSORPTION';

  FOR v_payment IN
    SELECT * FROM jsonb_to_recordset(COALESCE(p_payments, '[]'::jsonb)) AS x(
      payment_method_id uuid,
      amount numeric,
      reference text
    )
  LOOP
    v_payment_account := public.resolve_payment_ledger_account(p_store_id, v_payment.payment_method_id);
    INSERT INTO public.ledger_entries(batch_id, account_id, sale_id, line_ref, debit, credit, annotation)
    VALUES (
      v_batch_id,
      v_payment_account,
      v_sale_id,
      'payment',
      ROUND(COALESCE(v_payment.amount, 0), 2),
      0,
      jsonb_build_object('payment_method_id', v_payment.payment_method_id, 'reference', v_payment.reference)
    );
  END LOOP;

  INSERT INTO public.ledger_entries(batch_id, account_id, sale_id, line_ref, debit, credit, annotation)
  VALUES (
    v_batch_id, v_revenue_account, v_sale_id, 'gross_revenue', 0, ROUND(v_gross_revenue, 2),
    jsonb_build_object('recognized_from_fulfilled_qty_only', true)
  );

  IF ROUND(v_discount_absorption, 2) > 0 THEN
    INSERT INTO public.ledger_entries(batch_id, account_id, sale_id, line_ref, debit, credit, annotation)
    VALUES (
      v_batch_id, v_discount_account, v_sale_id, 'discount_absorption', ROUND(v_discount_absorption, 2), 0,
      jsonb_build_object('basis', 'mrp_minus_selling_price')
    );
  END IF;

  INSERT INTO public.ledger_entries(batch_id, account_id, sale_id, line_ref, debit, credit, annotation)
  VALUES (
    v_batch_id, v_cogs_account, v_sale_id, 'cogs', ROUND(v_cogs_total, 2), 0,
    jsonb_build_object('source', 'sale_items.cost')
  );

  INSERT INTO public.ledger_entries(batch_id, account_id, sale_id, line_ref, debit, credit, annotation)
  VALUES (
    v_batch_id, v_inventory_account, v_sale_id, 'inventory_reduction', 0, ROUND(v_cogs_total, 2),
    jsonb_build_object('source', 'sale_items.cost')
  );

  UPDATE public.sales
  SET ledger_batch_id = v_batch_id
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
      'ledger_batch_id', v_batch_id,
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
    'ledger_batch_id', v_batch_id,
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

CREATE OR REPLACE FUNCTION public.generate_daily_reconciliation(
  p_store_id uuid,
  p_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_start timestamptz := (p_date::timestamptz);
  v_end timestamptz := ((p_date + 1)::timestamptz);
  v_total_sales numeric(14,2) := 0;
  v_total_cash_inflow numeric(14,2) := 0;
  v_inventory_delta_value numeric(14,2) := 0;
  v_expected_inventory_delta numeric(14,2) := 0;
  v_mismatch jsonb := '[]'::jsonb;
  v_risk_overrides integer := 0;
BEGIN
  SELECT COALESCE(SUM(s.total_amount), 0)
    INTO v_total_sales
  FROM public.sales s
  WHERE s.store_id = p_store_id
    AND s.created_at >= v_start
    AND s.created_at < v_end
    AND s.status = 'completed';

  SELECT COALESCE(SUM(le.debit), 0)
    INTO v_total_cash_inflow
  FROM public.ledger_entries le
  JOIN public.ledger_batches lb ON lb.id = le.batch_id
  JOIN public.ledger_accounts la ON la.id = le.account_id
  WHERE lb.store_id = p_store_id
    AND lb.posted_at >= v_start
    AND lb.posted_at < v_end
    AND la.code IN ('1000_CASH', '1010_BANK');

  SELECT COALESCE(SUM(si.qty * si.cost), 0)
    INTO v_expected_inventory_delta
  FROM public.sale_items si
  JOIN public.sales s ON s.id = si.sale_id
  WHERE s.store_id = p_store_id
    AND s.created_at >= v_start
    AND s.created_at < v_end
    AND s.status = 'completed';

  SELECT COALESCE(SUM(le.credit), 0)
    INTO v_inventory_delta_value
  FROM public.ledger_entries le
  JOIN public.ledger_batches lb ON lb.id = le.batch_id
  JOIN public.ledger_accounts la ON la.id = le.account_id
  WHERE lb.store_id = p_store_id
    AND lb.posted_at >= v_start
    AND lb.posted_at < v_end
    AND la.code = '1200_INVENTORY';

  SELECT COUNT(*)
    INTO v_risk_overrides
  FROM public.ledger_batches lb
  WHERE lb.store_id = p_store_id
    AND lb.posted_at >= v_start
    AND lb.posted_at < v_end
    AND lb.risk_flag = true;

  IF ROUND(v_total_sales, 2) <> ROUND(v_total_cash_inflow, 2) THEN
    v_mismatch := v_mismatch || jsonb_build_object(
      'type', 'cash_vs_sales_mismatch',
      'total_sales', v_total_sales,
      'total_cash_inflow', v_total_cash_inflow
    );
  END IF;

  IF ROUND(v_expected_inventory_delta, 2) <> ROUND(v_inventory_delta_value, 2) THEN
    v_mismatch := v_mismatch || jsonb_build_object(
      'type', 'inventory_vs_cogs_mismatch',
      'expected_inventory_delta', v_expected_inventory_delta,
      'ledger_inventory_delta', v_inventory_delta_value
    );
  END IF;

  RETURN jsonb_build_object(
    'store_id', p_store_id,
    'date', p_date,
    'total_sales', ROUND(v_total_sales, 2),
    'total_cash_inflow', ROUND(v_total_cash_inflow, 2),
    'inventory_movement_vs_sales_delta', jsonb_build_object(
      'expected_inventory_delta', ROUND(v_expected_inventory_delta, 2),
      'ledger_inventory_delta', ROUND(v_inventory_delta_value, 2)
    ),
    'risk_override_count', v_risk_overrides,
    'mismatches', v_mismatch,
    'is_balanced', (jsonb_array_length(v_mismatch) = 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_sale_ledger_accounts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_sale_ledger_accounts(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_payment_ledger_account(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_payment_ledger_account(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.complete_sale(uuid, uuid, uuid, jsonb, jsonb, numeric, text, text, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_sale(uuid, uuid, uuid, jsonb, jsonb, numeric, text, text, jsonb, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.generate_daily_reconciliation(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_daily_reconciliation(uuid, date) TO authenticated;
