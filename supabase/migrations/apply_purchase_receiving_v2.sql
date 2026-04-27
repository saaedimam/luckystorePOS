-- ============================================
-- Purchase Receiving v2 - Complete Migration
-- Run this in Supabase SQL Editor if local CLI isn't available
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) purchase_receipts
--    Direct receiving (not via PO workflow), supports draft/posting,
--    partial payments, duplicate invoice protection.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  supplier_id     UUID NOT NULL REFERENCES public.parties(id) ON DELETE RESTRICT,
  invoice_number  TEXT,
  invoice_total   NUMERIC(15, 4) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(15, 4) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted')),
  notes           TEXT,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Duplicate invoice protection: unique per tenant+supplier+invoice_number (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_supplier_invoice
  ON public.purchase_receipts(tenant_id, supplier_id, invoice_number)
  WHERE invoice_number IS NOT NULL AND invoice_number <> '';

DROP TRIGGER IF EXISTS set_purchase_receipts_updated_at ON public.purchase_receipts;
CREATE TRIGGER set_purchase_receipts_updated_at
  BEFORE UPDATE ON public.purchase_receipts
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ---------------------------------------------------------------------------
-- 2) purchase_receipt_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id      UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity        NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit_cost       NUMERIC(15, 4) NOT NULL DEFAULT 0,
  UNIQUE (receipt_id, item_id)
);

-- ---------------------------------------------------------------------------
-- 3) RLS Policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

-- Helper: user's tenant_id from JWT
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'tenant_id')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- purchase_receipts policies
DROP POLICY IF EXISTS receipts_select ON public.purchase_receipts;
CREATE POLICY "receipts_select" ON public.purchase_receipts
  FOR SELECT TO authenticated
  USING (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS receipts_write ON public.purchase_receipts;
CREATE POLICY "receipts_write" ON public.purchase_receipts
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = (SELECT auth.uid())
        AND u.role IN ('admin', 'manager', 'stock')
    )
  );

-- purchase_receipt_items policies
DROP POLICY IF EXISTS receipt_items_select ON public.purchase_receipt_items;
CREATE POLICY "receipt_items_select" ON public.purchase_receipt_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_receipts pr
      WHERE pr.id = purchase_receipt_items.receipt_id
        AND pr.tenant_id = public.current_tenant_id()
    )
  );

DROP POLICY IF EXISTS receipt_items_write ON public.purchase_receipt_items;
CREATE POLICY "receipt_items_write" ON public.purchase_receipt_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_receipts pr
      WHERE pr.id = purchase_receipt_items.receipt_id
        AND pr.tenant_id = public.current_tenant_id()
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_id = (SELECT auth.uid())
            AND u.role IN ('admin', 'manager', 'stock')
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Indexes for performance
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_tenant ON public.purchase_receipts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_supplier ON public.purchase_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_store ON public.purchase_receipts(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_status ON public.purchase_receipts(status);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_receipt ON public.purchase_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_item ON public.purchase_receipt_items(item_id);

-- ============================================
-- RPC: record_purchase_v2
-- ============================================
CREATE OR REPLACE FUNCTION public.record_purchase_v2(
  p_idempotency_key      TEXT,
  p_tenant_id            UUID,
  p_store_id             UUID,
  p_supplier_id          UUID,
  p_invoice_number       TEXT DEFAULT NULL,
  p_invoice_total        NUMERIC(15, 4) DEFAULT NULL,
  p_items                JSONB,
  p_amount_paid          NUMERIC(15, 4) DEFAULT 0,
  p_payment_account_id   UUID DEFAULT NULL,
  p_payable_account_id   UUID DEFAULT NULL,
  p_status               TEXT DEFAULT 'posted',
  p_notes                TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_response            JSONB;
  v_receipt_id          UUID;
  v_batch_id            UUID;
  v_item                RECORD;
  v_total_cost          NUMERIC(15, 4) := 0;
  v_current_qty         NUMERIC(15, 4);
  v_current_avg_cost    NUMERIC(15, 4);
  v_new_avg_cost        NUMERIC(15, 4);
  v_inventory_account_id UUID;
  v_user_id             UUID := auth.uid();
  v_supplier_type       TEXT;
  v_payable_amount      NUMERIC(15, 4);
  v_item_count          INT := 0;
BEGIN
  -- 1. Idempotency Check
  v_response := public.check_idempotency(p_idempotency_key, p_tenant_id);
  IF v_response IS NOT NULL THEN
    RETURN v_response;
  END IF;

  -- 2. Validate status
  IF p_status NOT IN ('draft', 'posted') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be draft or posted.', p_status;
  END IF;

  -- 3. Validate supplier exists and is a supplier
  SELECT type INTO v_supplier_type
  FROM public.parties
  WHERE id = p_supplier_id AND tenant_id = p_tenant_id;
  IF v_supplier_type IS NULL THEN
    RAISE EXCEPTION 'Supplier not found';
  END IF;
  IF v_supplier_type <> 'supplier' THEN
    RAISE EXCEPTION 'Party is not a supplier (type: %)', v_supplier_type;
  END IF;

  -- 4. Duplicate invoice protection
  IF p_invoice_number IS NOT NULL AND p_invoice_number <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.purchase_receipts
      WHERE tenant_id = p_tenant_id
        AND supplier_id = p_supplier_id
        AND invoice_number = p_invoice_number
        AND status = 'posted'
    ) THEN
      RAISE EXCEPTION 'Duplicate invoice number % for this supplier', p_invoice_number;
    END IF;
  END IF;

  -- 5. Identify System Accounts
  SELECT id INTO v_inventory_account_id
  FROM public.accounts
  WHERE tenant_id = p_tenant_id AND name = 'Inventory Asset'
  LIMIT 1;
  IF v_inventory_account_id IS NULL THEN
    RAISE EXCEPTION 'Inventory Asset account not configured for tenant';
  END IF;

  -- 6. Validate items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No items provided for purchase';
  END IF;

  -- 7. Calculate total cost from items
  SELECT COALESCE(SUM((x.item->>'quantity')::NUMERIC * (x.item->>'unit_cost')::NUMERIC), 0)
  INTO v_total_cost
  FROM jsonb_array_elements(p_items) AS x(item);

  -- 8. Invoice total validation (if provided)
  IF p_invoice_total IS NOT NULL AND p_invoice_total > 0 THEN
    IF ABS(v_total_cost - p_invoice_total) > 1.00 THEN
      RAISE EXCEPTION 'Invoice total mismatch: calculated % but invoice says %', v_total_cost, p_invoice_total;
    END IF;
  END IF;

  -- 9. Validate amount_paid
  IF p_amount_paid < 0 THEN
    RAISE EXCEPTION 'Amount paid cannot be negative';
  END IF;
  IF p_amount_paid > v_total_cost THEN
    RAISE EXCEPTION 'Amount paid (%) cannot exceed total cost (%)', p_amount_paid, v_total_cost;
  END IF;

  -- 10. Create Purchase Receipt
  INSERT INTO public.purchase_receipts (
    tenant_id, store_id, supplier_id, invoice_number,
    invoice_total, amount_paid, status, notes, created_by
  ) VALUES (
    p_tenant_id, p_store_id, p_supplier_id, p_invoice_number,
    v_total_cost, p_amount_paid, p_status, p_notes, v_user_id
  ) RETURNING id INTO v_receipt_id;

  -- 11. If draft, return early (no journal posting)
  IF p_status = 'draft' THEN
    v_response := jsonb_build_object(
      'status', 'success',
      'receipt_id', v_receipt_id,
      'total_cost', v_total_cost,
      'state', 'draft'
    );
    UPDATE public.idempotency_keys
    SET completed_at = NOW(), response_body = v_response
    WHERE idempotency_key = p_idempotency_key AND tenant_id = p_tenant_id;
    RETURN v_response;
  END IF;

  -- 12. Create Journal Batch
  INSERT INTO public.journal_batches (tenant_id, store_id, created_by, status)
  VALUES (p_tenant_id, p_store_id, v_user_id, 'posted')
  RETURNING id INTO v_batch_id;

  -- 13. Process Each Item (Inventory + Weighted Average Cost)
  FOR v_item IN
    SELECT * FROM jsonb_to_recordset(p_items) AS x(item_id UUID, quantity NUMERIC, unit_cost NUMERIC, barcode TEXT)
  LOOP
    -- Validate item belongs to tenant
    IF NOT EXISTS (
      SELECT 1 FROM public.inventory_items
      WHERE id = v_item.item_id AND tenant_id = p_tenant_id
    ) THEN
      RAISE EXCEPTION 'Item % not found in tenant', v_item.item_id;
    END IF;

    -- Calculate New Weighted Average Cost
    SELECT COALESCE(SUM(quantity_change), 0) INTO v_current_qty
    FROM public.stock_movements
    WHERE item_id = v_item.item_id AND tenant_id = p_tenant_id;

    SELECT weighted_average_cost INTO v_current_avg_cost
    FROM public.stock_movements
    WHERE item_id = v_item.item_id AND tenant_id = p_tenant_id
    ORDER BY created_at DESC LIMIT 1;

    v_current_avg_cost := COALESCE(v_current_avg_cost, 0);

    IF (v_current_qty + v_item.quantity) > 0 THEN
      v_new_avg_cost := (v_current_qty * v_current_avg_cost + v_item.quantity * v_item.unit_cost)
                      / (v_current_qty + v_item.quantity);
    ELSE
      v_new_avg_cost := v_item.unit_cost;
    END IF;

    -- Record Stock Movement
    INSERT INTO public.stock_movements (
      tenant_id, store_id, item_id, quantity_change,
      weighted_average_cost, reference_type, reference_id, created_by
    ) VALUES (
      p_tenant_id, p_store_id, v_item.item_id, v_item.quantity,
      v_new_avg_cost, 'PURCHASE_RECEIPT', v_receipt_id, v_user_id
    );

    -- Save receipt item
    INSERT INTO public.purchase_receipt_items (receipt_id, item_id, quantity, unit_cost)
    VALUES (v_receipt_id, v_item.item_id, v_item.quantity, v_item.unit_cost);
  END LOOP;

  -- 14. Ledger: Debit Inventory Asset (full amount)
  INSERT INTO public.ledger_entries (
    tenant_id, store_id, journal_batch_id, account_id,
    debit_amount, party_id, reference_type, reference_id, created_by, notes
  ) VALUES (
    p_tenant_id, p_store_id, v_batch_id, v_inventory_account_id,
    v_total_cost, p_supplier_id, 'PURCHASE_RECEIPT', v_receipt_id, v_user_id,
    'Inventory from purchase receipt'
  );

  -- 15. Handle Payment Split: Cash Paid + Payable
  v_payable_amount := v_total_cost - p_amount_paid;

  -- Credit: Cash/Bank for amount paid now
  IF p_amount_paid > 0 THEN
    IF p_payment_account_id IS NULL THEN
      RAISE EXCEPTION 'Payment account required when amount_paid > 0';
    END IF;
    INSERT INTO public.ledger_entries (
      tenant_id, store_id, journal_batch_id, account_id,
      party_id, credit_amount, reference_type, reference_id, created_by, notes
    ) VALUES (
      p_tenant_id, p_store_id, v_batch_id, p_payment_account_id,
      p_supplier_id, p_amount_paid, 'PURCHASE_RECEIPT', v_receipt_id, v_user_id,
      'Cash payment on purchase'
    );
  END IF;

  -- Credit: Payable for remaining balance
  IF v_payable_amount > 0 THEN
    IF p_payable_account_id IS NULL THEN
      RAISE EXCEPTION 'Payable account required when there is a remaining balance';
    END IF;
    INSERT INTO public.ledger_entries (
      tenant_id, store_id, journal_batch_id, account_id,
      party_id, credit_amount, reference_type, reference_id, created_by, notes
    ) VALUES (
      p_tenant_id, p_store_id, v_batch_id, p_payable_account_id,
      p_supplier_id, v_payable_amount, 'PURCHASE_RECEIPT', v_receipt_id, v_user_id,
      'Payable from purchase receipt'
    );
  END IF;

  -- 16. Build response
  v_response := jsonb_build_object(
    'status', 'success',
    'receipt_id', v_receipt_id,
    'batch_id', v_batch_id,
    'total_cost', v_total_cost,
    'amount_paid', p_amount_paid,
    'payable_amount', v_payable_amount,
    'state', 'posted'
  );

  -- 17. Update Idempotency
  UPDATE public.idempotency_keys
  SET completed_at = NOW(), response_body = v_response
  WHERE idempotency_key = p_idempotency_key AND tenant_id = p_tenant_id;

  RETURN v_response;

EXCEPTION WHEN OTHERS THEN
  DELETE FROM public.idempotency_keys
  WHERE idempotency_key = p_idempotency_key AND tenant_id = p_tenant_id AND completed_at IS NULL;
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke and grant permissions
REVOKE ALL ON FUNCTION public.record_purchase_v2(TEXT, UUID, UUID, UUID, TEXT, NUMERIC, JSONB, NUMERIC, UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_purchase_v2(TEXT, UUID, UUID, UUID, TEXT, NUMERIC, JSONB, NUMERIC, UUID, UUID, TEXT, TEXT) TO authenticated;

-- ============================================
-- Helper RPC: post_draft_purchase_receipt
-- ============================================
CREATE OR REPLACE FUNCTION public.post_draft_purchase_receipt(
  p_receipt_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_receipt   public.purchase_receipts%ROWTYPE;
  v_items     JSONB;
  v_result    JSONB;
BEGIN
  -- Lock and fetch receipt
  SELECT * INTO v_receipt
  FROM public.purchase_receipts
  WHERE id = p_receipt_id
  FOR UPDATE;

  IF v_receipt.id IS NULL THEN
    RAISE EXCEPTION 'Receipt not found';
  END IF;

  IF v_receipt.status <> 'draft' THEN
    RAISE EXCEPTION 'Receipt is already % (not draft)', v_receipt.status;
  END IF;

  -- Build items JSONB from receipt items
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_id', pri.item_id,
      'quantity', pri.quantity,
      'unit_cost', pri.unit_cost
    )
  ) INTO v_items
  FROM public.purchase_receipt_items pri
  WHERE pri.receipt_id = p_receipt_id;

  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'No items found for this receipt';
  END IF;

  -- Call record_purchase_v2 with the assembled data
  SELECT public.record_purchase_v2(
    'post_draft_' || p_receipt_id::TEXT || '_' || NOW()::TEXT,
    v_receipt.tenant_id,
    v_receipt.store_id,
    v_receipt.supplier_id,
    v_receipt.invoice_number,
    v_receipt.invoice_total,
    v_items,
    v_receipt.amount_paid,
    NULL,
    NULL,
    'posted',
    v_receipt.notes
  ) INTO v_result;

  -- Mark the old receipt as posted
  UPDATE public.purchase_receipts
  SET status = 'posted',
      updated_at = NOW()
  WHERE id = p_receipt_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.post_draft_purchase_receipt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.post_draft_purchase_receipt(UUID) TO authenticated;

-- ============================================
-- Done! Purchase Receiving v2 is ready.
-- ============================================
