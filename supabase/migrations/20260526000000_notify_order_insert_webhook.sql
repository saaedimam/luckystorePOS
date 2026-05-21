-- =============================================================================
-- Migration: WhatsApp Initial Order Notification Webhook
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_notify_order()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := current_setting('app.settings.edge_function_url', true) || '/notify-order',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('request.headers', true)::jsonb->>'authorization'
        ),
        body := jsonb_build_object(
            'type', 'INSERT',
            'table', 'online_orders',
            'record', row_to_json(NEW)
        )
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Silently catch errors in local dev without pg_net configured, don't break transactions
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_order_insert ON public.online_orders;
CREATE TRIGGER tr_notify_order_insert
    AFTER INSERT ON public.online_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_notify_order();
