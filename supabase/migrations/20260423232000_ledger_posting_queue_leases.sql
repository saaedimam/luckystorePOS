-- Ledger posting queue with lease-based claiming for race-safe concurrency.
-- Supports cron, edge function, and manual admin triggers using one RPC path.

CREATE TABLE IF NOT EXISTS public.ledger_posting_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL UNIQUE REFERENCES public.sales(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CLAIMED', 'POSTED', 'FAILED')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 8 CHECK (max_attempts > 0),
  locked_by text,
  locked_at timestamptz,
  lock_expires_at timestamptz,
  priority integer NOT NULL DEFAULT 100,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_workers (
  worker_id text PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lpq_pending_claim
  ON public.ledger_posting_queue (priority DESC, created_at)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_lpq_claimed_expiry
  ON public.ledger_posting_queue (lock_expires_at)
  WHERE status = 'CLAIMED';

CREATE INDEX IF NOT EXISTS idx_lpq_store_status
  ON public.ledger_posting_queue (store_id, status, created_at);

ALTER TABLE public.ledger_posting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_workers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lpq_set_updated_at ON public.ledger_posting_queue;
CREATE TRIGGER trg_lpq_set_updated_at
BEFORE UPDATE ON public.ledger_posting_queue
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_ledger_workers_set_updated_at ON public.ledger_workers;
CREATE TRIGGER trg_ledger_workers_set_updated_at
BEFORE UPDATE ON public.ledger_workers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.register_ledger_worker(p_worker_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_worker_id IS NULL OR btrim(p_worker_id) = '' THEN
    RAISE EXCEPTION 'worker_id required';
  END IF;

  INSERT INTO public.ledger_workers (worker_id, active, last_heartbeat)
  VALUES (p_worker_id, true, now())
  ON CONFLICT (worker_id)
  DO UPDATE SET
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
  SET last_heartbeat = now(),
      active = true,
      updated_at = now()
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
  SET active = false,
      updated_at = now()
  WHERE worker_id = p_worker_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_sale_for_ledger_posting(
  p_sale_id uuid,
  p_store_id uuid,
  p_priority integer DEFAULT 100
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_queue_id uuid;
BEGIN
  INSERT INTO public.ledger_posting_queue (
    sale_id, store_id, status, priority, attempt_count, max_attempts, last_error
  )
  VALUES (
    p_sale_id, p_store_id, 'PENDING', COALESCE(p_priority, 100), 0, 8, NULL
  )
  ON CONFLICT (sale_id)
  DO UPDATE SET
    store_id = EXCLUDED.store_id,
    priority = EXCLUDED.priority,
    status = CASE
      WHEN public.ledger_posting_queue.status = 'POSTED' THEN 'POSTED'
      ELSE 'PENDING'
    END,
    locked_by = CASE
      WHEN public.ledger_posting_queue.status = 'POSTED' THEN public.ledger_posting_queue.locked_by
      ELSE NULL
    END,
    locked_at = CASE
      WHEN public.ledger_posting_queue.status = 'POSTED' THEN public.ledger_posting_queue.locked_at
      ELSE NULL
    END,
    lock_expires_at = CASE
      WHEN public.ledger_posting_queue.status = 'POSTED' THEN public.ledger_posting_queue.lock_expires_at
      ELSE NULL
    END,
    last_error = CASE
      WHEN public.ledger_posting_queue.status = 'POSTED' THEN public.ledger_posting_queue.last_error
      ELSE NULL
    END,
    updated_at = now()
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_ledger_posting_jobs(
  p_worker_id text,
  p_batch_size integer DEFAULT 10,
  p_store_id uuid DEFAULT NULL
)
RETURNS SETOF public.ledger_posting_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM 1
  FROM public.ledger_workers w
  WHERE w.worker_id = p_worker_id
    AND w.active = true
    AND w.last_heartbeat >= now() - interval '2 minutes';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'worker not active or stale: %', p_worker_id;
  END IF;

  RETURN QUERY
  WITH claimable AS (
    SELECT q.id
    FROM public.ledger_posting_queue q
    WHERE q.status = 'PENDING'
      AND q.attempt_count < q.max_attempts
      AND (q.lock_expires_at IS NULL OR q.lock_expires_at < now())
      AND (p_store_id IS NULL OR q.store_id = p_store_id)
    ORDER BY q.priority DESC, q.created_at
    LIMIT GREATEST(1, COALESCE(p_batch_size, 1))
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.ledger_posting_queue q
  SET status = 'CLAIMED',
      locked_by = p_worker_id,
      locked_at = now(),
      lock_expires_at = now() + interval '2 minutes',
      updated_at = now()
  FROM claimable c
  WHERE q.id = c.id
  RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.reclaim_stale_ledger_locks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reclaimed integer := 0;
BEGIN
  UPDATE public.ledger_posting_queue q
  SET status = 'PENDING',
      attempt_count = q.attempt_count + 1,
      locked_by = NULL,
      locked_at = NULL,
      lock_expires_at = NULL,
      last_error = COALESCE(q.last_error, 'stale_lease_reclaimed'),
      updated_at = now()
  WHERE q.status = 'CLAIMED'
    AND q.lock_expires_at IS NOT NULL
    AND q.lock_expires_at < now()
    AND q.attempt_count < q.max_attempts;

  GET DIAGNOSTICS v_reclaimed = ROW_COUNT;
  RETURN v_reclaimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_ledger_posting_batch(
  p_worker_id text,
  p_batch_size integer DEFAULT 50,
  p_store_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job public.ledger_posting_queue%ROWTYPE;
  v_sale record;
  v_result jsonb;
  v_status text;
  v_processed integer := 0;
  v_posted integer := 0;
  v_retry integer := 0;
  v_failed integer := 0;
BEGIN
  PERFORM public.register_ledger_worker(p_worker_id);
  PERFORM public.heartbeat_ledger_worker(p_worker_id);
  PERFORM public.reclaim_stale_ledger_locks();

  FOR v_job IN
    SELECT *
    FROM public.claim_ledger_posting_jobs(
      p_worker_id,
      GREATEST(1, COALESCE(p_batch_size, 1)),
      p_store_id
    )
  LOOP
    v_processed := v_processed + 1;

    BEGIN
      SELECT s.id, s.store_id, s.accounting_posting_status, s.ledger_batch_id, s.created_at
      INTO v_sale
      FROM public.sales s
      WHERE s.id = v_job.sale_id
      FOR UPDATE;

      IF v_sale.id IS NULL THEN
        UPDATE public.ledger_posting_queue
        SET status = 'FAILED',
            attempt_count = attempt_count + 1,
            last_error = 'sale_not_found',
            locked_by = NULL,
            locked_at = NULL,
            lock_expires_at = NULL,
            updated_at = now()
        WHERE id = v_job.id;
        v_failed := v_failed + 1;
        CONTINUE;
      END IF;

      IF v_sale.accounting_posting_status = 'POSTED' OR v_sale.ledger_batch_id IS NOT NULL THEN
        UPDATE public.ledger_posting_queue
        SET status = 'POSTED',
            last_error = NULL,
            locked_by = NULL,
            locked_at = NULL,
            lock_expires_at = NULL,
            updated_at = now()
        WHERE id = v_job.id;
        v_posted := v_posted + 1;
        CONTINUE;
      END IF;

      IF public.is_period_closed(v_sale.store_id, COALESCE(v_sale.created_at, now())) THEN
        UPDATE public.sales
        SET accounting_posting_status = 'FAILED_POSTING',
            accounting_posting_error = 'period_closed'
        WHERE id = v_sale.id;

        UPDATE public.ledger_posting_queue
        SET status = 'FAILED',
            attempt_count = attempt_count + 1,
            last_error = 'period_closed',
            locked_by = NULL,
            locked_at = NULL,
            lock_expires_at = NULL,
            updated_at = now()
        WHERE id = v_job.id;

        v_failed := v_failed + 1;
        CONTINUE;
      END IF;

      v_result := public.post_sale_to_ledger(v_sale.id);
      v_status := COALESCE(v_result->>'status', 'FAILED_POSTING');

      IF v_status = 'POSTED' THEN
        UPDATE public.ledger_posting_queue
        SET status = 'POSTED',
            last_error = NULL,
            locked_by = NULL,
            locked_at = NULL,
            lock_expires_at = NULL,
            updated_at = now()
        WHERE id = v_job.id;
        v_posted := v_posted + 1;
      ELSE
        UPDATE public.ledger_posting_queue
        SET status = CASE
              WHEN attempt_count + 1 >= max_attempts THEN 'FAILED'
              ELSE 'PENDING'
            END,
            attempt_count = attempt_count + 1,
            last_error = COALESCE(v_result->>'message', 'posting_failed'),
            locked_by = NULL,
            locked_at = NULL,
            lock_expires_at = NULL,
            updated_at = now()
        WHERE id = v_job.id;

        IF (SELECT status FROM public.ledger_posting_queue WHERE id = v_job.id) = 'FAILED' THEN
          v_failed := v_failed + 1;
        ELSE
          v_retry := v_retry + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.ledger_posting_queue
      SET status = CASE
            WHEN attempt_count + 1 >= max_attempts THEN 'FAILED'
            ELSE 'PENDING'
          END,
          attempt_count = attempt_count + 1,
          last_error = SQLERRM,
          locked_by = NULL,
          locked_at = NULL,
          lock_expires_at = NULL,
          updated_at = now()
      WHERE id = v_job.id;

      IF (SELECT status FROM public.ledger_posting_queue WHERE id = v_job.id) = 'FAILED' THEN
        v_failed := v_failed + 1;
      ELSE
        v_retry := v_retry + 1;
      END IF;
    END;
  END LOOP;

  PERFORM public.heartbeat_ledger_worker(p_worker_id);

  RETURN jsonb_build_object(
    'worker_id', p_worker_id,
    'processed', v_processed,
    'posted', v_posted,
    'retry_scheduled', v_retry,
    'failed', v_failed
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.process_pending_ledger_postings(
  p_store_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_worker_id text := format('compat-worker-%s', replace(gen_random_uuid()::text, '-', ''));
BEGIN
  RETURN public.process_ledger_posting_batch(
    v_worker_id,
    GREATEST(1, COALESCE(p_limit, 1)),
    p_store_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_sale_for_ledger_posting_from_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.accounting_posting_status = 'PENDING_POSTING' THEN
    PERFORM public.enqueue_sale_for_ledger_posting(NEW.id, NEW.store_id, 100);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_sale_for_ledger_posting ON public.sales;
CREATE TRIGGER trg_enqueue_sale_for_ledger_posting
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_sale_for_ledger_posting_from_sales();

INSERT INTO public.ledger_posting_queue (sale_id, store_id, status, priority)
SELECT s.id, s.store_id, 'PENDING', 100
FROM public.sales s
WHERE s.accounting_posting_status = 'PENDING_POSTING'
ON CONFLICT (sale_id) DO NOTHING;

REVOKE ALL ON TABLE public.ledger_posting_queue FROM PUBLIC;
REVOKE ALL ON TABLE public.ledger_workers FROM PUBLIC;

REVOKE ALL ON FUNCTION public.register_ledger_worker(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_ledger_worker(text) TO authenticated;

REVOKE ALL ON FUNCTION public.heartbeat_ledger_worker(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.heartbeat_ledger_worker(text) TO authenticated;

REVOKE ALL ON FUNCTION public.deactivate_ledger_worker(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_ledger_worker(text) TO authenticated;

REVOKE ALL ON FUNCTION public.enqueue_sale_for_ledger_posting(uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_sale_for_ledger_posting(uuid, uuid, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_ledger_posting_jobs(text, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_ledger_posting_jobs(text, integer, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.reclaim_stale_ledger_locks() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_ledger_locks() TO authenticated;

REVOKE ALL ON FUNCTION public.process_ledger_posting_batch(text, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_ledger_posting_batch(text, integer, uuid) TO authenticated;
