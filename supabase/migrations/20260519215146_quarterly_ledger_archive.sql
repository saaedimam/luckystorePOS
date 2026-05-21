-- Migration: Quarterly Ledger Archival & Snapshot Compression
-- Date: 2026-05-19
-- Purpose: Aggregate stock_ledger entries >1 year old into inventory_snapshots
--           without violating serializable isolation or locking active rows.

-- =============================================================================
-- 1. SNAPSHOT TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    item_id         UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    
    total_in        NUMERIC(15, 3) NOT NULL DEFAULT 0,
    total_out       NUMERIC(15, 3) NOT NULL DEFAULT 0,
    net_change      NUMERIC(15, 3) NOT NULL DEFAULT 0,
    
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    
    source_ledger_ids UUID[] NOT NULL,
    ledger_entry_count INTEGER NOT NULL DEFAULT 0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_by     UUID REFERENCES auth.users(id),
    
    CONSTRAINT valid_period CHECK (period_end > period_start),
    CONSTRAINT net_change_check CHECK (net_change = total_in - total_out),
    CONSTRAINT unique_tenant_item_period UNIQUE (store_id, item_id, period_start)
);

ALTER TABLE public.inventory_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation on inventory_snapshots"
    ON public.inventory_snapshots
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.store_id = inventory_snapshots.store_id 
        AND users.auth_id = auth.uid()
    ));

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_period 
    ON public.inventory_snapshots(store_id, item_id, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_store_period 
    ON public.inventory_snapshots(store_id, period_start, period_end);

-- =============================================================================
-- 2. ARCHIVAL FUNCTION (High-Velocity, Strict Truncation)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.archive_stock_ledger_quarterly(
    p_cutoff_date TIMESTAMPTZ DEFAULT (now() - INTERVAL '1 year')
)
RETURNS TABLE (
    snapshots_created BIGINT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_batch_size CONSTANT INTEGER := 5000;
    v_snapshot_count BIGINT := 0;
    v_oldest_date TIMESTAMPTZ;
    v_newest_date TIMESTAMPTZ;
BEGIN
    PERFORM pg_advisory_lock(42);
    
    BEGIN
        WITH ledger_to_archive AS (
            SELECT 
                sl.store_id,
                sl.item_id,
                date_trunc('quarter', sl.created_at) AS q_start,
                (date_trunc('quarter', sl.created_at) + INTERVAL '3 months' - INTERVAL '1 microsecond') AS q_end,
                COALESCE(SUM(CASE WHEN sl.transaction_type IN ('purchase_add', 'adjustment', 'return_in', 'transfer_in') 
                                  THEN sl.quantity_change ELSE 0 END), 0) AS total_in,
                COALESCE(SUM(CASE WHEN sl.transaction_type IN ('sale_deduction', 'transfer_out', 'return_out') 
                                  THEN sl.quantity_change ELSE 0 END), 0) AS total_out,
                array_agg(sl.id) AS ledger_ids,
                COUNT(*) AS entry_count
            FROM public.stock_ledger sl
            WHERE sl.created_at < p_cutoff_date
              AND NOT EXISTS (
                  SELECT 1 FROM public.inventory_snapshots sn
                  WHERE sn.store_id = sl.store_id
                    AND sn.item_id = sl.item_id
                    AND sn.period_start = date_trunc('quarter', sl.created_at)
              )
            GROUP BY sl.store_id, sl.item_id, date_trunc('quarter', sl.created_at)
            LIMIT v_batch_size
        ),
        inserted_snapshots AS (
            INSERT INTO public.inventory_snapshots (
                store_id, item_id, total_in, total_out, net_change,
                period_start, period_end, source_ledger_ids, ledger_entry_count,
                archived_by
            )
            SELECT 
                store_id, item_id, total_in, total_out, total_in - total_out,
                q_start, q_end, ledger_ids, entry_count, auth.uid()
            FROM ledger_to_archive
            RETURNING id
        )
        SELECT COUNT(*) INTO v_snapshot_count FROM inserted_snapshots;
        
        PERFORM pg_advisory_unlock(42);
        
        SELECT MIN(q_start), MAX(q_end)
        INTO v_oldest_date, v_newest_date
        FROM (
            SELECT date_trunc('quarter', sl.created_at) AS q_start,
                   (date_trunc('quarter', sl.created_at) + INTERVAL '3 months' - INTERVAL '1 microsecond') AS q_end
            FROM public.stock_ledger sl
            WHERE sl.created_at < p_cutoff_date
            LIMIT v_batch_size
        ) x;

        RETURN QUERY 
        SELECT v_snapshot_count, v_oldest_date, v_newest_date;
        
    EXCEPTION WHEN OTHERS THEN
        PERFORM pg_advisory_unlock(42);
        RAISE;
    END;
END;
$$;

-- =============================================================================
-- 3. CRON SCHEDULE
-- =============================================================================

SELECT cron.schedule(
    'quarterly-ledger-archive',
    '0 3 1 1,4,7,10 *',  -- 3 AM on Jan 1, Apr 1, Jul 1, Oct 1
    $$SELECT public.archive_stock_ledger_quarterly(now() - INTERVAL '1 year')$$,
    'UTC'
);

-- =============================================================================
-- 4. UNIFIED VIEW (Strict Date-Partition Pruning Filter)
-- =============================================================================

CREATE OR REPLACE VIEW public.unified_stock_movements AS
SELECT store_id, item_id, net_change AS quantity, period_end AS created_at,
       'snapshot'::TEXT AS movement_type, NULL::UUID AS sale_id, 
       NULL::UUID AS purchase_id, source_ledger_ids AS metadata
FROM public.inventory_snapshots
UNION ALL
SELECT store_id, item_id, quantity_change AS quantity, created_at, transaction_type::TEXT AS movement_type,
       NULL::UUID AS sale_id, NULL::UUID AS purchase_id, NULL::UUID[] AS metadata
FROM public.stock_ledger
WHERE created_at >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year');

-- =============================================================================
-- 5. GOVERNANCE DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.archive_stock_ledger_quarterly IS 
'Quarterly archival of stock_ledger entries >1 year old into inventory_snapshots.
No on-conflict handling: fails violently on duplicate periods for pipeline visibility.
Advisory lock key=42 prevents concurrent execution.
Does NOT delete from stock_ledger (immutable contract).
Serializable-safe: only reads rows < cutoff_date, never touches active rows.';

COMMENT ON TABLE public.inventory_snapshots IS 
'Compressed quarterly snapshots of stock_ledger aggregates. 
Used for fast historical queries. Does NOT replace stock_ledger (immutable).';
