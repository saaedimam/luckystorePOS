-- =============================================================================
-- Migration: Online Order Module & Rider Infrastructure
-- =============================================================================

-- 1. Riders Table
CREATE TABLE IF NOT EXISTS public.riders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text UNIQUE NOT NULL,
    is_active boolean DEFAULT true,
    live_location geography(point),
    last_location_update timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Online Orders Table
-- Statuses: pending, confirmed, preparing, out_for_delivery, delivered, cancelled
CREATE TABLE IF NOT EXISTS public.online_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    delivery_address text NOT NULL,
    delivery_location geography(point),
    total_amount numeric(12,2) NOT NULL,
    delivery_fee numeric(12,2) DEFAULT 0,
    status text DEFAULT 'pending',
    payment_method text DEFAULT 'COD',
    payment_status text DEFAULT 'pending',
    rider_id uuid REFERENCES public.riders(id) ON DELETE SET NULL,
    notes text,
    whatsapp_notified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Online Order Items
CREATE TABLE IF NOT EXISTS public.online_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.online_orders(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    qty integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 4. Delivery Zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    radius_km numeric DEFAULT 5,
    base_fee numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(store_id)
);

-- 5. Reserved Stock Column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reserved_online integer DEFAULT 0;

-- 6. RLS Policies
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Tenants isolation
CREATE POLICY "riders_tenant_isolation" ON public.riders 
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id'::uuid);

CREATE POLICY "online_orders_tenant_isolation" ON public.online_orders 
    FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id'::uuid);

CREATE POLICY "online_order_items_tenant_isolation" ON public.online_order_items 
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.online_orders o 
        WHERE o.id = order_id AND o.tenant_id = auth.jwt() ->> 'tenant_id'::uuid
    ));

-- 7. Stock Reservation Trigger
CREATE OR REPLACE FUNCTION public.handle_online_order_stock_reservation()
RETURNS TRIGGER AS $$
BEGIN
    -- If order is confirmed: deduct stock_qty, increment reserved_online
    IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'confirmed') THEN
        UPDATE public.products p
        SET stock_qty = stock_qty - oi.qty,
            reserved_online = reserved_online + oi.qty
        FROM public.online_order_items oi
        WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
        
    -- If order is cancelled/delivered: decrement reserved_online
    -- (If cancelled, we also need to return stock_qty if it was previously confirmed)
    ELSIF (TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'preparing', 'out_for_delivery') AND NEW.status = 'cancelled') THEN
        UPDATE public.products p
        SET stock_qty = stock_qty + oi.qty,
            reserved_online = reserved_online - oi.qty
        FROM public.online_order_items oi
        WHERE oi.order_id = NEW.id AND p.id = oi.product_id;

    ELSIF (TG_OP = 'UPDATE' AND OLD.status IN ('confirmed', 'preparing', 'out_for_delivery') AND NEW.status = 'delivered') THEN
        UPDATE public.products p
        SET reserved_online = reserved_online - oi.qty
        FROM public.online_order_items oi
        WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_online_order_stock_reservation
    AFTER UPDATE ON public.online_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_online_order_stock_reservation();
