-- =============================================================================
-- Migration: WhatsApp Order Notification Webhook
-- =============================================================================

-- Enable the pg_net extension if not already enabled (required for outgoing requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to trigger the edge function
-- Note: This requires the edge function to be deployed and accessible.
-- For local/staging testing, we usually use the Supabase Dashboard to set this up,
-- but we can scaffold the SQL foundation here.

CREATE OR REPLACE FUNCTION public.trigger_whatsapp_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on status change
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM net.http_post(
            url := 'https://<PROJECT_REF>.functions.supabase.co/whatsapp-order-notify',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('request.headers')::jsonb->>'authorization'
            ),
            body := jsonb_build_object(
                'type', 'UPDATE',
                'table', 'online_orders',
                'record', row_to_json(NEW),
                'old_record', row_to_json(OLD)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_whatsapp_order_notification ON public.online_orders;
CREATE TRIGGER tr_whatsapp_order_notification
    AFTER UPDATE ON public.online_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_whatsapp_notification();
