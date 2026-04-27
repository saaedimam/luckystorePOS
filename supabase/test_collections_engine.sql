-- Validation Script for Lucky Store Collections Engine
-- Run this in the Supabase SQL Editor to verify Phase 1 & 2

BEGIN;

-- 1. Setup Test Data
INSERT INTO tenants (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Test Tenant');
INSERT INTO stores (id, tenant_id, code, name) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TEST001', 'Test Store');

-- Setup Accounts
INSERT INTO accounts (id, tenant_id, name, type) VALUES 
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Cash in Hand', 'asset'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Inventory Asset', 'asset'),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Sales Revenue', 'revenue'),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Cost of Goods Sold', 'expense');

-- Ensure Accounts Receivable
SELECT public.get_or_create_ar_account('00000000-0000-0000-0000-000000000001');

-- Setup Item
INSERT INTO inventory_items (id, tenant_id, name, sku) VALUES 
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Test Item', 'SKU-001');

-- Setup Customer Party
INSERT INTO parties (id, tenant_id, type, name, phone) VALUES 
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'customer', 'Test Customer', '01700000000');

-- Add initial stock so COGS works (using current schema)
INSERT INTO stock_movements (store_id, item_id, delta, reason, meta)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000007', 10, 'INITIAL', '{"note":"Initial stock for test"}');

-- 2. Test Record Sale on Credit (Sell 2 items at 100 each = 200 total)
DO $$
DECLARE
  v_ar_id UUID;
BEGIN
  v_ar_id := public.get_or_create_ar_account('00000000-0000-0000-0000-000000000001');
  
  PERFORM public.record_sale(
      'test_credit_sale_001',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '[{"item_id": "00000000-0000-0000-0000-000000000007", "quantity": 2, "unit_price": 100}]'::JSONB,
      jsonb_build_array(
          jsonb_build_object(
              'account_id', v_ar_id,
              'amount', 200,
              'party_id', '00000000-0000-0000-0000-000000000009'
          )
      )
  );
END $$;

-- 3. Verify Aging Query Returns the Customer
DO $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT balance_due INTO v_balance
    FROM public.get_receivables_aging('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
    WHERE party_id = '00000000-0000-0000-0000-000000000009';

    IF v_balance != 200 THEN 
        RAISE EXCEPTION 'Receivables aging mismatch. Expected 200, got %', v_balance; 
    END IF;
END $$;

-- 4. Test Record Payment (Customer pays 50)
SELECT public.record_customer_payment(
    'test_payment_001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000009',
    50,
    '00000000-0000-0000-0000-000000000003' -- Cash account
);

-- 5. Verify Balance Reduced
DO $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT balance_due INTO v_balance
    FROM public.get_receivables_aging('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
    WHERE party_id = '00000000-0000-0000-0000-000000000009';

    IF v_balance != 150 THEN 
        RAISE EXCEPTION 'Receivables aging after payment mismatch. Expected 150, got %', v_balance; 
    END IF;
END $$;

-- 6. Test Followup Notes & Reminders
SELECT public.add_followup_note(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000009',
    'Promised to pay tomorrow',
    CURRENT_DATE + 1
);

SELECT public.log_customer_reminder(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000009',
    'whatsapp'
);

-- Verify Note Appears in Aging
DO $$
DECLARE
    v_note TEXT;
BEGIN
    SELECT last_note INTO v_note
    FROM public.get_receivables_aging('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
    WHERE party_id = '00000000-0000-0000-0000-000000000009';

    IF v_note != 'Promised to pay tomorrow' THEN 
        RAISE EXCEPTION 'Note mismatch. Expected "Promised to pay tomorrow", got %', v_note; 
    END IF;
END $$;

ROLLBACK; -- Don't commit test data
