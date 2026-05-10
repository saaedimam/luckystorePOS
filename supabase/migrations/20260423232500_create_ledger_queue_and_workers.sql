-- =============================================================================
-- Create ledger_posting_queue and ledger_workers tables.
-- These are referenced by 20260423233000_ledger_posting_hardening.sql
-- but were never explicitly created in the migration chain.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ledger_posting_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    sale_id uuid NOT NULL,
    store_id uuid NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL
      CHECK (status IN ('PENDING', 'CLAIMED', 'POSTED', 'FAILED')),
    attempt_count integer DEFAULT 0 NOT NULL CHECK (attempt_count >= 0),
    max_attempts integer DEFAULT 8 NOT NULL CHECK (max_attempts > 0),
    locked_by text,
    locked_at timestamptz,
    lock_expires_at timestamptz,
    priority integer DEFAULT 100 NOT NULL,
    last_error text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lpq_status_priority
  ON public.ledger_posting_queue (status, priority DESC, created_at);

CREATE TABLE IF NOT EXISTS public.ledger_workers (
    worker_id text NOT NULL PRIMARY KEY,
    active boolean DEFAULT true NOT NULL,
    last_heartbeat timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Worker helper functions referenced by ledger_posting_hardening
CREATE OR REPLACE FUNCTION public.register_ledger_worker(p_worker_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.ledger_workers (worker_id, active, last_heartbeat)
  VALUES (p_worker_id, true, now())
  ON CONFLICT (worker_id) DO UPDATE SET
    active = true,
    last_heartbeat = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_ledger_worker(p_worker_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.ledger_workers
  SET last_heartbeat = now(), updated_at = now()
  WHERE worker_id = p_worker_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_ledger_worker(p_worker_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.ledger_workers
  SET active = false, updated_at = now()
  WHERE worker_id = p_worker_id;
END;
$$;
