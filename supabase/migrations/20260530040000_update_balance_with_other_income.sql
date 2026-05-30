-- P2: Update calculate_total_balance RPC to include other_income
-- This migration patches the balance calculation to include non-sales revenue

CREATE OR REPLACE FUNCTION calculate_total_balance(
  p_tenant_id UUID,
  p_store_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_cash NUMERIC,
  total_bank NUMERIC,
  total_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cash_data AS (
    SELECT COALESCE(SUM(
      CASE 
        WHEN payment_method = 'Cash' THEN amount 
        WHEN payment_method = 'bKash' THEN amount
        ELSE 0 
      END
    ), 0) as cash_total
    FROM sales
    WHERE tenant_id = p_tenant_id
      AND (p_store_id IS NULL OR store_id = p_store_id)
      AND payment_status = 'paid'
  ),
  bank_data AS (
    SELECT COALESCE(SUM(
      CASE 
        WHEN payment_method = 'Bank' THEN amount 
        ELSE 0 
      END
    ), 0) as bank_total
    FROM sales
    WHERE tenant_id = p_tenant_id
      AND (p_store_id IS NULL OR store_id = p_store_id)
      AND payment_status = 'paid'
  ),
  other_income_data AS (
    -- NEW: Include other_income in cash/bank totals based on payment_method
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN payment_method IN ('Cash', 'bKash') THEN amount 
          ELSE 0 
        END
      ), 0) as other_cash,
      COALESCE(SUM(
        CASE 
          WHEN payment_method = 'Bank' THEN amount 
          ELSE 0 
        END
      ), 0) as other_bank
    FROM other_income
    WHERE tenant_id = p_tenant_id
      AND (p_store_id IS NULL OR store_id = p_store_id)
  )
  SELECT 
    (c.cash_total + o.other_cash) as total_cash,
    (b.bank_total + o.other_bank) as total_bank,
    (c.cash_total + b.bank_total + o.other_cash + o.other_bank) as total_balance
  FROM cash_data c
  CROSS JOIN bank_data b
  CROSS JOIN other_income_data o;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_total_balance(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_balance(UUID, UUID) TO service_role;

COMMENT ON FUNCTION calculate_total_balance IS 
'Calculates total cash, bank, and combined balance for a tenant/store.
Includes sales revenue AND other_income (display fees, delivery charges, etc.)';
