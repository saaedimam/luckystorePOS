-- =============================================================================
-- Migration: Enhanced Idempotency & Sale RPC v2
-- =============================================================================

-- Add operation_id for idempotency to sales table
ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS operation_id text UNIQUE;

-- Upgraded complete_sale RPC for the new schema
CREATE OR REPLACE FUNCTION public.complete_sale_v2(
    p_store_id uuid,
    p_cashier_id uuid,
    p_customer_id uuid DEFAULT NULL,
    p_items jsonb DEFAULT '[]'::jsonb, -- [{product_id, qty, unit_price, discount}]
    p_payments jsonb DEFAULT '[]'::jsonb, -- [{method, amount, reference}]
    p_total numeric DEFAULT 0,
    p_discount numeric DEFAULT 0,
    p_offline_created_at timestamptz DEFAULT NULL,
    p_operation_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale_id uuid;
    v_item jsonb;
    v_payment jsonb;
BEGIN
    -- 1) Idempotency Check
    IF p_operation_id IS NOT NULL THEN
        SELECT id INTO v_sale_id FROM public.sales WHERE operation_id = p_operation_id;
        IF FOUND THEN
            RETURN jsonb_build_object('status', 'SUCCESS', 'sale_id', v_sale_id, 'is_duplicate', true);
        END IF;
    END IF;

    -- 2) Insert Sale
    INSERT INTO public.sales (
        store_id, 
        cashier_id, 
        customer_id, 
        total, 
        discount, 
        status, 
        offline_created_at, 
        synced_at,
        operation_id
    ) VALUES (
        p_store_id, 
        p_cashier_id, 
        p_customer_id, 
        p_total, 
        p_discount, 
        'completed', 
        COALESCE(p_offline_created_at, now()), 
        now(),
        p_operation_id
    ) RETURNING id INTO v_sale_id;

    -- 3) Insert Sale Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.sale_items (
            sale_id, 
            product_id, 
            qty, 
            unit_price, 
            discount
        ) VALUES (
            v_sale_id, 
            (v_item->>'product_id')::uuid, 
            (v_item->>'qty')::integer, 
            (v_item->>'unit_price')::numeric, 
            COALESCE((v_item->>'discount')::numeric, 0)
        );
        
        -- Deduct stock
        UPDATE public.products 
        SET stock_qty = stock_qty - (v_item->>'qty')::integer 
        WHERE id = (v_item->>'product_id')::uuid;
    END LOOP;

    -- 4) Insert Payments
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
    LOOP
        INSERT INTO public.payments (
            sale_id, 
            method, 
            amount, 
            reference
        ) VALUES (
            v_sale_id, 
            (v_payment->>'method')::text, 
            (v_payment->>'amount')::numeric, 
            (v_payment->>'reference')::text
        );
    END LOOP;

    RETURN jsonb_build_object('status', 'SUCCESS', 'sale_id', v_sale_id);
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.complete_sale_v2 FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_sale_v2 TO authenticated;
