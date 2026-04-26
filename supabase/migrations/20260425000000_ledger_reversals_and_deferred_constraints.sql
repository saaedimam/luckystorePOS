-- =================================================================================
-- Ledger Hardening: Reversals & Deferred Constraints
-- Addresses architectural gaps for production ERP use.
-- =================================================================================

-- 1) Reversals
-- Allow a batch to be reversed by another batch
ALTER TABLE public.ledger_batches
  ADD COLUMN IF NOT EXISTS reverses_batch_id uuid REFERENCES public.ledger_batches(id);

-- 2) Deferred Constraint for Debits = Credits
-- Removes row-level triggers that block multi-row inserts, 
-- replacing it with a commit-time constraint trigger.

-- First, drop any existing row-level balancing triggers if they exist
-- (Assuming they might have been created, although the previous schema relied on RPC checks)
-- DROP TRIGGER IF EXISTS trg_ledger_balance_check ON public.ledger_entries;

CREATE OR REPLACE FUNCTION public.check_ledger_batch_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance numeric(14,2);
BEGIN
  SELECT SUM(debit) - SUM(credit) INTO v_balance
  FROM public.ledger_entries
  WHERE batch_id = NEW.batch_id;

  IF v_balance <> 0 THEN
    RAISE EXCEPTION 'Ledger batch % is out of balance by %', NEW.batch_id, v_balance;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deferred_ledger_balance ON public.ledger_entries;
CREATE CONSTRAINT TRIGGER trg_deferred_ledger_balance
  AFTER INSERT OR UPDATE ON public.ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.check_ledger_batch_balance();

-- 3) Chart of Accounts Hierarchy (Simple parent-child)
ALTER TABLE public.ledger_accounts
  ADD COLUMN IF NOT EXISTS parent_account_id uuid REFERENCES public.ledger_accounts(id);
