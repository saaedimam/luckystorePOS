-- =============================================================================
-- Migration: Add DB Trigger to call low stock sync alert bridge webhook
-- Date: 2026-05-19
-- Purpose: Asynchronously trigger low stock alerts via Edge Functions and Stitch
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_sync_alert_bridge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  func_url text;
  anon_key text;
  request_body text;
BEGIN
  -- Retrieve URL and API Key from runtime parameters (configurable per staging/local env)
  func_url := coalesce(
    current_setting('app.settings.sync_alert_bridge_url', true),
    'http://localhost:54321/functions/v1/sync-alert-bridge'
  );
  anon_key := coalesce(
    current_setting('app.settings.anon_key', true),
    ''
  );

  request_body := json_build_object(
    'type', 'INSERT',
    'table', 'stock_ledger',
    'schema', 'public',
    'record', json_build_object(
      'id', NEW.id,
      'store_id', NEW.store_id,
      'product_id', NEW.product_id,
      'quantity', NEW.quantity_change,
      'created_at', NEW.created_at
    )
  )::text;

  -- Use pg_net extension for async, non-blocking HTTP request
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    PERFORM net.http_post(
      url := func_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', anon_key,
        'Authorization', 'Bearer ' || anon_key
      ),
      body := request_body::jsonb,
      timeout_milliseconds := 5000
    );
  ELSE
    RAISE WARNING 'pg_net extension not found. Webhook to % could not be dispatched.', func_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_alert_bridge ON public.stock_ledger;
CREATE TRIGGER trg_sync_alert_bridge
  AFTER INSERT ON public.stock_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_alert_bridge();

COMMENT ON FUNCTION public.trigger_sync_alert_bridge() IS 
  'Triggers low stock alerting edge function via non-blocking HTTP post using pg_net when stock ledger gets new entries.';
