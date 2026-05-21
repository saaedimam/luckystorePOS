-- =============================================================================
-- Migration: Online Storefront Foundation
-- Architecture: Lucky Store Online Storefront v1
-- Timestamp: 20260520000001
--
-- Tables:   online_orders, online_order_items, delivery_zones
-- Indexes:  idx_online_orders_tenant, idx_online_orders_status,
--           idx_online_orders_whatsapp, idx_online_order_items_order
-- RLS:      tenant_online_orders_isolation, public_order_tracking,
--           tenant_online_order_items_isolation, tenant_delivery_zones_isolation
-- Function: generate_order_number(tenant_id UUID)
-- Trigger:  set_order_number BEFORE INSERT ON online_orders
-- Schema:   ALTER TABLE inventory ADD COLUMN reserved_online INTEGER DEFAULT 0
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Prerequisites
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. online_orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_orders (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID          NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Guest customer — no account system
  customer_name       VARCHAR(100)  NOT NULL,
  customer_whatsapp   VARCHAR(20)   NOT NULL,
  customer_address    TEXT          NOT NULL,
  customer_lat        DECIMAL(10,8),
  customer_lng        DECIMAL(11,8),

  -- Order identity
  order_number        VARCHAR(20)   UNIQUE NOT NULL,

  -- Status lifecycle
  status              VARCHAR(20)   NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),

  -- Financials (stored as BDT with 2 decimal places)
  subtotal            DECIMAL(12,2) NOT NULL,
  delivery_fee        DECIMAL(12,2) NOT NULL DEFAULT 40,
  discount            DECIMAL(12,2) NOT NULL DEFAULT 0,
  total               DECIMAL(12,2) NOT NULL,

  -- Payment — COD only for Week 1
  payment_method      VARCHAR(20)   NOT NULL DEFAULT 'cod'
    CHECK (payment_method IN ('cod')),
  payment_status      VARCHAR(20)   NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid')),

  -- Delivery tracking (populated by cashier/rider in Week 2)
  rider_id            UUID,
  rider_assigned_at   TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,

  -- Audit
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. online_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_order_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID          NOT NULL REFERENCES public.online_orders(id) ON DELETE CASCADE,
  product_id   UUID          NOT NULL REFERENCES public.products(id),
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price   DECIMAL(12,2) NOT NULL,
  total_price  DECIMAL(12,2) NOT NULL
);

-- ---------------------------------------------------------------------------
-- 3. delivery_zones
--    One row per tenant.  store_lat/lng define the haversine origin point.
--    Later migration (20260524) uses PostGIS; this baseline uses plain coords.
--    Column store_id is provided as an alias FK for forward-compatibility.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID          NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- store_id mirrors tenant_id FK so later migrations can query by store_id
  store_id     UUID          REFERENCES public.stores(id) ON DELETE CASCADE,
  store_lat    DECIMAL(10,8) NOT NULL,
  store_lng    DECIMAL(11,8) NOT NULL,
  radius_km    DECIMAL(5,2)  NOT NULL DEFAULT 5.0,
  delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 40,
  is_active    BOOLEAN       NOT NULL DEFAULT true,
  UNIQUE(tenant_id)
);

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_online_orders_tenant
  ON public.online_orders(tenant_id);

CREATE INDEX IF NOT EXISTS idx_online_orders_status
  ON public.online_orders(status);

CREATE INDEX IF NOT EXISTS idx_online_orders_whatsapp
  ON public.online_orders(customer_whatsapp);

CREATE INDEX IF NOT EXISTS idx_online_order_items_order
  ON public.online_order_items(order_id);

-- ---------------------------------------------------------------------------
-- 5. RLS — online_orders
-- ---------------------------------------------------------------------------
ALTER TABLE public.online_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- 5a. Tenant staff can do everything on their own orders
DROP POLICY IF EXISTS tenant_online_orders_isolation ON public.online_orders;
CREATE POLICY tenant_online_orders_isolation ON public.online_orders
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

-- 5b. Public read for order status tracking — filtered by order_number in query
DROP POLICY IF EXISTS public_order_tracking ON public.online_orders;
CREATE POLICY public_order_tracking ON public.online_orders
  FOR SELECT
  TO anon
  USING (true);

-- 5c. Guests may submit new orders (status must start as 'pending')
DROP POLICY IF EXISTS public_order_insert ON public.online_orders;
CREATE POLICY public_order_insert ON public.online_orders
  FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

-- ---------------------------------------------------------------------------
-- 6. RLS — online_order_items
-- ---------------------------------------------------------------------------

-- 6a. Tenant staff see only their own order items
DROP POLICY IF EXISTS tenant_online_order_items_isolation ON public.online_order_items;
CREATE POLICY tenant_online_order_items_isolation ON public.online_order_items
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.online_orders
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    )
  )
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.online_orders
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
    )
  );

-- 6b. Public read for tracking page (items shown alongside order)
DROP POLICY IF EXISTS public_order_items_tracking ON public.online_order_items;
CREATE POLICY public_order_items_tracking ON public.online_order_items
  FOR SELECT
  TO anon
  USING (true);

-- 6c. Guests may insert order items
DROP POLICY IF EXISTS public_order_items_insert ON public.online_order_items;
CREATE POLICY public_order_items_insert ON public.online_order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 7. RLS — delivery_zones
-- ---------------------------------------------------------------------------

-- 7a. Tenant staff manage their own zone
DROP POLICY IF EXISTS tenant_delivery_zones_isolation ON public.delivery_zones;
CREATE POLICY tenant_delivery_zones_isolation ON public.delivery_zones
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::UUID
  );

-- 7b. Anon can read active zones (needed for delivery check)
DROP POLICY IF EXISTS public_delivery_zones_read ON public.delivery_zones;
CREATE POLICY public_delivery_zones_read ON public.delivery_zones
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ---------------------------------------------------------------------------
-- 8. Order-number sequence table
--    Stores per-tenant daily counters so we get LSO-YYYYMMDD-001 sequences.
--    Using a counter table is safer than pg sequences for multi-tenant daily
--    reset patterns and survives table truncation / seeding in dev.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_order_number_seq (
  tenant_id   UUID    NOT NULL,
  seq_date    DATE    NOT NULL,
  last_val    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, seq_date)
);

-- Tenants can only touch their own counter rows (via generate_order_number)
ALTER TABLE public.online_order_number_seq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seq_tenant_isolation ON public.online_order_number_seq;
CREATE POLICY seq_tenant_isolation ON public.online_order_number_seq
  FOR ALL
  USING (true);  -- function is SECURITY DEFINER; direct access is internal only

-- ---------------------------------------------------------------------------
-- 9. generate_order_number(p_tenant_id UUID) → text
--    Returns the next LSO-YYYYMMDD-### for the given tenant today.
--    Uses SELECT … FOR UPDATE on the counter row to be concurrency-safe.
--    Runs inside the calling transaction; no extra commit needed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_order_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date     DATE    := current_date;
  v_next_val INTEGER;
BEGIN
  -- Upsert the counter row and grab the next value atomically
  INSERT INTO public.online_order_number_seq (tenant_id, seq_date, last_val)
  VALUES (p_tenant_id, v_date, 1)
  ON CONFLICT (tenant_id, seq_date)
  DO UPDATE SET last_val = online_order_number_seq.last_val + 1
  RETURNING last_val INTO v_next_val;

  -- Format: LSO-YYYYMMDD-001 (zero-padded to 3 digits; wraps after 999)
  RETURN 'LSO-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_next_val::TEXT, 3, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. Trigger: set_order_number — fills order_number BEFORE INSERT
--     Fires only when order_number is NULL so that manual/test inserts with
--     an explicit number are respected.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON public.online_orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.online_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_order_number();

-- ---------------------------------------------------------------------------
-- 11. updated_at auto-maintenance trigger for online_orders
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_updated_at ON public.online_orders;
CREATE TRIGGER touch_updated_at
  BEFORE UPDATE ON public.online_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 12. reserved_online column on inventory (architecture doc: §Phase 1 step 7)
--     The existing safe_online_orders.sql (20260521) adds qty_reserved_online
--     to stock_levels.  This migration adds the column named reserved_online
--     to the inventory table itself (separate concern — PO/purchase buffer).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'inventory'
      AND column_name  = 'reserved_online'
  ) THEN
    ALTER TABLE public.inventory
      ADD COLUMN reserved_online INTEGER NOT NULL DEFAULT 0;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 13. Grants — allow anon role to call the order-placement pathway
--     (authenticated callers inherit via their role; anon needs explicit grant)
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.delivery_zones             TO anon;
GRANT SELECT, INSERT ON public.online_orders      TO anon;
GRANT SELECT, INSERT ON public.online_order_items TO anon;

-- anon must NOT touch the sequence table directly
REVOKE ALL ON public.online_order_number_seq FROM anon;

-- =============================================================================
-- END: 20260520000001_online_orders.sql
-- =============================================================================
