-- =============================================================================
-- Migration: WhatsApp Order Notification Webhook
-- Description: Database trigger to send WhatsApp notifications on order status changes
-- Note: Edge function must be deployed for this to work
-- =============================================================================

-- Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper function to get the edge function URL
-- In production, this should be set via environment variable or Supabase config
CREATE OR REPLACE FUNCTION public.get_edge_function_url(function_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Construct URL from project ref environment variable
    -- Falls back to a placeholder for local development
    RETURN COALESCE(
        current_setting('app.edge_function_url', true),
        'https://' || current_setting('app.supabase_project_ref', true) || '.supabase.co/functions/v1/' || function_name
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create the webhook trigger function
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_notification()
RETURNS TRIGGER AS $$
DECLARE
    edge_function_url TEXT;
    payload JSONB;
    request_result BIGINT;
BEGIN
    -- Only trigger on meaningful status changes
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Validate status is one we notify for
        IF NEW.status NOT IN ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') THEN
            RETURN NEW;
        END IF;

        -- Skip if customer has no WhatsApp
        IF NEW.customer_whatsapp IS NULL OR NEW.customer_whatsapp = '' THEN
            RAISE LOG 'Skipping WhatsApp notification: no customer_whatsapp for order %', NEW.id;
            RETURN NEW;
        END IF;

        -- Build the edge function URL
        edge_function_url := public.get_edge_function_url('whatsapp-order-notify');

        -- Build payload
        payload := jsonb_build_object(
            'type', 'UPDATE',
            'table', 'online_orders',
            'record', row_to_json(NEW),
            'old_record', row_to_json(OLD),
            'timestamp', now()
        );

        -- Make async HTTP request to edge function
        -- Note: This is fire-and-forget. The edge function handles logging.
        BEGIN
            PERFORM net.http_post(
                url := edge_function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := payload
            );

            RAISE LOG 'WhatsApp notification queued for order %: % -> %', NEW.id, OLD.status, NEW.status;

        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the transaction
            RAISE WARNING 'Failed to queue WhatsApp notification for order %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS tr_whatsapp_order_notification ON public.online_orders;

-- Create the trigger
CREATE TRIGGER tr_whatsapp_order_notification
    AFTER UPDATE ON public.online_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_whatsapp_notification();

-- Comment
COMMENT ON FUNCTION public.trigger_whatsapp_notification() IS 'Sends WhatsApp notifications when online order status changes';

-- Create helper function to manually trigger notification (for testing/recovery)
CREATE OR REPLACE FUNCTION public.send_whatsapp_notification_manually(
    p_order_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    edge_function_url TEXT;
    payload JSONB;
BEGIN
    -- Get order details
    SELECT * INTO v_order FROM public.online_orders WHERE id = p_order_id;

    IF v_order IS NULL THEN
        RETURN jsonb_build_object('error', 'Order not found');
    END IF;

    -- Use provided status or current status
    IF p_status IS NOT NULL THEN
        v_order.status := p_status;
    END IF;

    edge_function_url := public.get_edge_function_url('whatsapp-order-notify');

    payload := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'online_orders',
        'record', row_to_json(v_order),
        'old_record', row_to_json(v_order),
        'manual_trigger', true,
        'timestamp', now()
    );

    -- This returns immediately, actual sending happens async
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := payload
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'WhatsApp notification queued',
        'order_id', p_order_id,
        'status', v_order.status
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
