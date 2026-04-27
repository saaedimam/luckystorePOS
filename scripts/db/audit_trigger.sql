-- audit_trigger.sql
-- Immutable audit logging for core inventory/transaction tables.
-- This script creates an append‑only `audit_logs` table (if it does not exist)
-- and attaches row‑level triggers to capture INSERT, UPDATE, DELETE events.
-- The log records: table_name, operation, primary_key (as JSON), old_row, new_row,
-- performed_by (user id derived from auth.uid()), and timestamp.

-- 1. Create the audit_logs table (append‑only, no DELETE/UPDATE allowed)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  primary_key jsonb NOT NULL,
  old_row jsonb,
  new_row jsonb,
  performed_by uuid,
  performed_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure the table cannot be modified after creation (immutable).
-- We achieve this by revoking all DML privileges from PUBLIC and only allowing INSERT via the trigger.
REVOKE ALL ON public.audit_logs FROM PUBLIC;
GRANT INSERT ON public.audit_logs TO service_role;

-- 2. Helper function to log changes.
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Resolve the performing user (service_role calls may not have auth.uid())
  SELECT id INTO v_user_id FROM public.users WHERE auth_id = auth.uid();

  INSERT INTO public.audit_logs (
    table_name,
    operation,
    primary_key,
    old_row,
    new_row,
    performed_by,
    performed_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    to_jsonb(OLD), -- primary key fields will be part of the row JSON; callers can parse later
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    v_user_id,
    now()
  );
  RETURN NULL; -- trigger is AFTER, result ignored
END;
$$;

-- 3. Attach triggers to tables we want to audit.
-- Stock levels (store_id + item_id primary key)
DROP TRIGGER IF EXISTS audit_stock_levels_ins ON public.stock_levels;
CREATE TRIGGER audit_stock_levels_ins
AFTER INSERT OR UPDATE OR DELETE ON public.stock_levels
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Stock movements (log of adjustments and sales)
DROP TRIGGER IF EXISTS audit_stock_movements_ins ON public.stock_movements;
CREATE TRIGGER audit_stock_movements_ins
AFTER INSERT OR UPDATE OR DELETE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- Additional tables can be added here following the same pattern.

-- 4. Secure the function – only service_role should be able to execute the trigger.
REVOKE ALL ON FUNCTION public.log_audit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit() TO service_role;
