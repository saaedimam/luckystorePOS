-- =============================================================================
-- Migration: Safe Online Orders MVL
-- =============================================================================

-- 1. Add reserved stock column to stock_levels
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_levels' AND column_name='qty_reserved_online') THEN
    ALTER TABLE public.stock_levels ADD COLUMN qty_reserved_online integer DEFAULT 0;
  END IF;
END $$;

-- 2. Create online_orders tables
CREATE TABLE IF NOT EXISTS public.online_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_number text UNIQUE NOT NULL,
    customer_name text NOT NULL,
    customer_whatsapp text NOT NULL,
    delivery_address text NOT NULL,
    subtotal integer NOT NULL,
    delivery_fee integer DEFAULT 4000,
    total integer NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending','preparing','out_for_delivery','delivered','cancelled')),
    payment_method text DEFAULT 'cod',
    cancellation_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.online_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.online_orders(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price integer NOT NULL,
    total_price integer NOT NULL
);

-- 2.5 Reconcile foreign key constraints for online_order_items (item_id -> products.id)
ALTER TABLE public.online_order_items 
  DROP CONSTRAINT IF EXISTS online_order_items_item_id_fkey,
  DROP CONSTRAINT IF EXISTS online_order_items_product_id_fkey;

ALTER TABLE public.online_order_items
  ADD CONSTRAINT online_order_items_item_id_fkey 
  FOREIGN KEY (item_id) REFERENCES public.products(id);

-- 3. RLS
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert orders" ON public.online_orders;
CREATE POLICY "public insert orders" ON public.online_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public select orders" ON public.online_orders;
CREATE POLICY "public select orders" ON public.online_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "staff update orders" ON public.online_orders;
CREATE POLICY "staff update orders" ON public.online_orders FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public insert items" ON public.online_order_items;
CREATE POLICY "public insert items" ON public.online_order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public select items" ON public.online_order_items;
CREATE POLICY "public select items" ON public.online_order_items FOR SELECT USING (true);

-- Tenants isolation for staff
DROP POLICY IF EXISTS "online_orders_tenant_isolation" ON public.online_orders;
CREATE POLICY "online_orders_tenant_isolation" ON public.online_orders 
    FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid OR auth.role() = 'anon');

-- 4. RPCs

-- When customer places order:
CREATE OR REPLACE FUNCTION public.place_online_order(
    p_store_id uuid,
    p_customer_name text,
    p_whatsapp text,
    p_address text,
    p_items jsonb,
    p_subtotal integer,
    p_delivery_fee integer,
    p_total integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions', 'pg_temp' AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_item jsonb;
    v_tenant_id uuid;
    v_available integer;
BEGIN
    -- Get tenant
    SELECT tenant_id INTO v_tenant_id FROM public.stores WHERE id = p_store_id;
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Store not found'; END IF;

    -- Generate order number
    v_order_number := 'LSO-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 9000 + 1000)::text, 4, '0');

    -- Insert order
    INSERT INTO public.online_orders (tenant_id, store_id, order_number, customer_name, customer_whatsapp, delivery_address, subtotal, delivery_fee, total)
    VALUES (v_tenant_id, p_store_id, v_order_number, p_customer_name, p_whatsapp, p_address, p_subtotal, p_delivery_fee, p_total)
    RETURNING id INTO v_order_id;

    -- Process items & reserve stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Check stock
        SELECT (qty - COALESCE(qty_reserved_online, 0)) INTO v_available 
        FROM public.stock_levels 
        WHERE store_id = p_store_id AND item_id = (v_item->>'product_id')::uuid FOR UPDATE;

        IF v_available IS NULL OR v_available < (v_item->>'quantity')::integer THEN
            RAISE EXCEPTION 'Insufficient stock for item %', v_item->>'product_id';
        END IF;

        -- Update reserved
        UPDATE public.stock_levels 
        SET qty_reserved_online = COALESCE(qty_reserved_online, 0) + (v_item->>'quantity')::integer
        WHERE store_id = p_store_id AND item_id = (v_item->>'product_id')::uuid;

        -- Insert item
        INSERT INTO public.online_order_items (order_id, item_id, quantity, unit_price, total_price)
        VALUES (
            v_order_id, 
            (v_item->>'product_id')::uuid, 
            (v_item->>'quantity')::integer, 
            (v_item->>'unit_price')::integer, 
            (v_item->>'quantity')::integer * (v_item->>'unit_price')::integer
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'order_number', v_order_number);
END;
$$;

-- When cashier transitions order status:
CREATE OR REPLACE FUNCTION public.update_online_order_status(
    p_order_id uuid,
    p_new_status text,
    p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions', 'pg_temp' AS $$
DECLARE
    v_order record;
    v_item record;
BEGIN
    SELECT * INTO v_order FROM public.online_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

    -- Releasing reservations on cancel
    IF p_new_status = 'cancelled' AND v_order.status IN ('pending', 'preparing', 'out_for_delivery') THEN
        FOR v_item IN SELECT * FROM public.online_order_items WHERE order_id = p_order_id
        LOOP
            UPDATE public.stock_levels 
            SET qty_reserved_online = GREATEST(0, COALESCE(qty_reserved_online, 0) - v_item.quantity)
            WHERE store_id = v_order.store_id AND item_id = v_item.item_id;
        END LOOP;
    
    -- Fulfillment: free reservation and permanently deduct actual stock via secure ledger RPC
    ELSIF p_new_status = 'delivered' AND v_order.status != 'delivered' THEN
        FOR v_item IN SELECT * FROM public.online_order_items WHERE order_id = p_order_id
        LOOP
            UPDATE public.stock_levels 
            SET qty_reserved_online = GREATEST(0, COALESCE(qty_reserved_online, 0) - v_item.quantity)
            WHERE store_id = v_order.store_id AND item_id = v_item.item_id;

            -- Deduct stock securely via the core ledger RPC!
            PERFORM public.deduct_stock(
                v_order.store_id, 
                v_item.item_id, 
                v_item.quantity, 
                jsonb_build_object('order_id', p_order_id, 'source', 'online_delivery')
            );
        END LOOP;
    END IF;

    UPDATE public.online_orders 
    SET status = p_new_status, cancellation_reason = COALESCE(p_reason, cancellation_reason), updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
END;
$$;
