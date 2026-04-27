-- Validation Script for Retail Profit Control System RPCs
-- Run this in the Supabase SQL Editor to verify Phase 1 & 2

BEGIN;

-- 1. Setup Test Data
INSERT INTO tenants (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Test Tenant');
INSERT INTO stores (id, tenant_id, name) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Test Store');

-- Setup Accounts
INSERT INTO accounts (id, tenant_id, name, type) VALUES 
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Cash in Hand', 'asset'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Inventory Asset', 'asset'),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Sales Revenue', 'revenue'),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Cost of Goods Sold', 'expense');

-- Setup Item
INSERT INTO inventory_items (id, tenant_id, name, sku) VALUES 
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Test Item', 'SKU-001');

-- Setup Party
INSERT INTO parties (id, tenant_id, type, name) VALUES 
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'supplier', 'Test Supplier');

-- 2. Test Record Purchase (Buy 10 items at 50 each)
SELECT public.record_purchase(
    'test_purchase_001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000003', -- Cash
    '[{"item_id": "00000000-0000-0000-0000-000000000007", "quantity": 10, "unit_cost": 50}]'::JSONB
);

-- 3. Verify Purchase Results
DO $$
BEGIN
    IF (SELECT SUM(quantity_change) FROM stock_movements) != 10 THEN RAISE EXCEPTION 'Stock quantity mismatch'; END IF;
    IF (SELECT weighted_average_cost FROM stock_movements LIMIT 1) != 50 THEN RAISE EXCEPTION 'Avg cost mismatch'; END IF;
END $$;

-- 4. Test Record Sale (Sell 2 items at 100 each)
SELECT public.record_sale(
    'test_sale_001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    NULL,
    '00000000-0000-0000-0000-000000000003', -- Cash
    '[{"item_id": "00000000-0000-0000-0000-000000000007", "quantity": 2, "unit_price": 100}]'::JSONB
);

-- 5. Verify Sale Results
-- Revenue should be 200, COGS should be 100 (2 * 50)
DO $$
BEGIN
    IF (SELECT SUM(quantity_change) FROM stock_movements) != 8 THEN RAISE EXCEPTION 'Stock quantity after sale mismatch'; END IF;
    IF (SELECT SUM(debit_amount - credit_amount) FROM ledger_entries WHERE account_id = '00000000-0000-0000-0000-000000000003') != -300 THEN 
        -- Cash was 0, Purchase -500, Sale +200 = -300
        RAISE EXCEPTION 'Cash balance mismatch: %', (SELECT SUM(debit_amount - credit_amount) FROM ledger_entries WHERE account_id = '00000000-0000-0000-0000-000000000003'); 
    END IF;
END $$;

-- 6. Test Cash Closing
SELECT public.record_cash_closing(
    'test_close_001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    -310 -- Intentional shortage of 10
);

ROLLBACK; -- Don't commit test data
